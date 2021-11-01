#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

#include "flecs.h"
#include "base64.h"
#include "fastlz.h"

// Global world
static ecs_world_t *world;

// Utilities for capturing (parser) errors
static ecs_strbuf_t err_buf = ECS_STRBUF_INIT;
bool str_set = false;

static 
void capture_log(int32_t level, const char *file, int32_t line, const char *msg)
{
    if (!str_set && level < 0) {
        ecs_strbuf_appendstr(&err_buf, msg);
        str_set = true;
    }

    printf("flecs: %*s%s\n", ecs_os_api.log_indent_, "", msg);
}

static
char* get_error() {
    str_set = false;
    char *str = ecs_strbuf_get(&err_buf);
    char *escaped = ecs_astresc('"', str);
    ecs_os_free(str);
    return escaped;
}

EMSCRIPTEN_KEEPALIVE
void init() {
    // Capture error messages so we can send it to the client
    ecs_os_set_api_defaults();
    ecs_os_api_t api = ecs_os_api;
    api.log_ = capture_log;
    ecs_os_set_api(&api);

    // Only enable errors, don't insert color codes
    ecs_log_set_level(-1);
    ecs_log_enable_colors(false);

    world = ecs_mini();
    if (!world) {
        ecs_err("failed to create world");
        return;
    }

    /* Import basic modules for serialization */
    ECS_IMPORT(world, FlecsMeta);
    ECS_IMPORT(world, FlecsDoc);
    ECS_IMPORT(world, FlecsCoreDoc);
}

EMSCRIPTEN_KEEPALIVE
char* query(char *q) {
    ecs_strbuf_t reply = ECS_STRBUF_INIT;
    ecs_rule_t *r = ecs_rule_init(world, &(ecs_filter_desc_t) { .expr = q });
    if (!r) {
        goto error;
    }

    ecs_iter_t it = ecs_rule_iter(world, r);
    if (ecs_iter_to_json_buf(world, &it, &reply, &(ecs_iter_to_json_desc_t) {
        .measure_eval_duration = true
    }) != 0) {
        ecs_strbuf_reset(&reply);
        goto error;
    }

    return ecs_strbuf_get(&reply);
error: {
        char *err = get_error();
        ecs_strbuf_append(&reply, "{\"error\": \"%s\"}", err);
        ecs_os_free(err);  
        return ecs_strbuf_get(&reply);
    }
}

EMSCRIPTEN_KEEPALIVE
char* get_entity(char *path) {
    ecs_strbuf_t reply = ECS_STRBUF_INIT;

    ecs_entity_t ent = ecs_lookup_path(world, 0, path);

    if (ecs_entity_to_json_buf(world, ent, &reply) != 0) {
        ecs_strbuf_reset(&reply);
        return ecs_os_strdup("{\"error\": \"failed to serialize entity\"}");
    }

    return ecs_strbuf_get(&reply);
}

EMSCRIPTEN_KEEPALIVE
char* run(char *plecs) {
    ecs_strbuf_t reply = ECS_STRBUF_INIT;

    /* Reset world */
    ecs_fini(world);
    init();

    ecs_strbuf_list_push(&reply, "{", ",");

    int res = ecs_plecs_from_str(world, NULL, plecs);
    char *err = get_error();
    if (res || err) {
        ecs_strbuf_list_append(&reply, "\"error\": \"%s\"", err);
        ecs_os_free(err);
    }

    ecs_strbuf_list_pop(&reply, "}");

    return ecs_strbuf_get(&reply);
}

/* Create a base64 encoded version of the input string that's safe to pass
 * around in URL. Compress first to reduce the overhead of base64. */
EMSCRIPTEN_KEEPALIVE
char* encode(const char *str) {
    int32_t length = ecs_os_strlen(str) + 1;

    /* Compression lib states that out buffer should be at least 5% more than
     * input, use 10% just to be safe. Add four additional bytes to store the
     * length of the compressed string. */
    int32_t compress_size = (int32_t)((float)length * 1.1) + 1 + sizeof(size_t);
    unsigned char *compress = ecs_os_malloc(compress_size);
    *(size_t*)compress = length;

    /* Compress string, use better compression at some cpu cost */
    int32_t actual_size = fastlz_compress_level(
        2, str, length, compress + sizeof(size_t)) + sizeof(size_t);

    /* Base64 encode compressed data */
    int32_t base64_size = base64_encode_size(actual_size);
    void *base64_str = ecs_os_malloc(base64_size);
    base64_encode(compress, actual_size, base64_str);

    /* No longer need the compressed string */
    ecs_os_free(compress);

    return base64_str;
}

EMSCRIPTEN_KEEPALIVE
char* decode(const char *str) {
    int32_t length = ecs_os_strlen(str);

    /* Base64 decode compressed data (output data is guaranteed smaller) */
    unsigned char *base64_decoded = ecs_os_malloc(length);
    int32_t base64_decoded_length = base64_decode(str, length, base64_decoded);
    assert(base64_decoded_length <= length);
    assert(base64_decoded_length > 0);

    /* Get length from decompressed data */
    size_t str_length = *(size_t*)base64_decoded;
    base64_decoded_length -= sizeof(size_t);
    assert(base64_decoded_length > 0);

    /* Decompress data (length includes 0 terminator) */
    char *out_str = ecs_os_malloc(str_length);
    int32_t decompress_length = fastlz_decompress(
        base64_decoded + sizeof(size_t), base64_decoded_length, out_str, str_length);

    assert(decompress_length == str_length);
    
    ecs_os_free(base64_decoded);

    return out_str;
}

#ifndef __EMSCRIPTEN__
int main(int argc, char *argv[]) {
    init();

    ecs_plecs_from_file(world, "etc/assets/db.plecs");

    while (1) {
        char str[1024];
        printf("\n?- ");
        fgets(str, sizeof(str), stdin);

        char *res = query(str);
        printf("JSON = %s\n", res);
        char *encoded = encode(res);
        char *decoded = decode(encoded);
        ecs_assert(!ecs_os_strcmp(res, decoded), ECS_INTERNAL_ERROR, NULL);
        ecs_os_free(res);
        ecs_os_free(encoded);
        ecs_os_free(decoded);
    }

    return 0;
}
#endif
