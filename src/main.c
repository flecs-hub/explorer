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
void capture_error(
    const char *msg,
    va_list args)
{
    if (!str_set) {
        ecs_strbuf_vappend(&err_buf, msg, args);
        str_set = true;
    }
}

static
char* get_error() {
    str_set = false;
    char *str = ecs_strbuf_get(&err_buf);
    char *escaped = ecs_astresc('"', str);
    ecs_os_free(str);
    return escaped;
}

static
int variable_count(ecs_rule_t *r) {
    int32_t i, var_count = ecs_rule_variable_count(r), count = 0;
    for (i = 0; i < var_count; i ++) {
        const char *var_name = ecs_rule_variable_name(r, i);
        if (var_name[0] == '.') {
            continue;
        }
        if (var_name[0] == '_') {
            continue;
        }

        count ++;
    }

    return count;
}

static
void reply_variables(ecs_strbuf_t *reply, ecs_rule_t *r) {
    ecs_strbuf_list_appendstr(reply, "\"variables\":");
    ecs_strbuf_list_push(reply, "[", ",");

    int32_t var_count = ecs_rule_variable_count(r);
    for (int i = 0; i < var_count; i ++) {
        if (!ecs_rule_variable_is_entity(r, i)) {
            continue;
        }
        const char *var_name = ecs_rule_variable_name(r, i);
        if (var_name[0] == '_' || var_name[0] == '.') {
            continue;
        }

        ecs_strbuf_list_append(reply, "\"%s\"", var_name);
    }

    ecs_strbuf_list_pop(reply, "]");
}

static
void reply_results(ecs_strbuf_t *reply, ecs_rule_t *r) {
    ecs_iter_t it = ecs_rule_iter(world, r);
    int32_t var_count = ecs_rule_variable_count(r);

    ecs_strbuf_list_append(reply, "\"term_count\": %d", it.term_count);

    ecs_strbuf_list_appendstr(reply, "\"results\":");
    ecs_strbuf_list_push(reply, "[", ",");

    while (ecs_rule_next(&it)) {
        /* Begin result */
        ecs_strbuf_list_next(reply);
        ecs_strbuf_list_push(reply, "{", ",");

        /* Output terms */
        ecs_strbuf_list_appendstr(reply, "\"terms\":");
        ecs_strbuf_list_push(reply, "[", ",");

        for (int i = 0; i < it.term_count; i ++) {
            char *id_str = ecs_id_str(world, ecs_term_id(&it, i + 1));
            ecs_strbuf_list_append(reply, "\"%s\"", id_str);
            ecs_os_free(id_str);
        }
        ecs_strbuf_list_pop(reply, "]");

        /* Output whether terms are set */
        ecs_strbuf_list_appendstr(reply, "\"terms_set\":");
        ecs_strbuf_list_push(reply, "[", ",");

        for (int i = 0; i < it.term_count; i ++) {
            if (ecs_term_is_set(&it, i + 1)) {
                ecs_strbuf_list_appendstr(reply, "true");
            } else {
                ecs_strbuf_list_appendstr(reply, "false");
            }
        }
        ecs_strbuf_list_pop(reply, "]");

        /* Output variables */
        ecs_strbuf_list_appendstr(reply, "\"variables\":");
        ecs_strbuf_list_push(reply, "[", ",");
        for (int i = 0; i < var_count; i ++) {
            if (!ecs_rule_variable_is_entity(r, i)) {
                continue;
            }
            const char *var_name = ecs_rule_variable_name(r, i);
            if (var_name[0] == '_' || var_name[0] == '.') {
                continue;
            }                
            ecs_entity_t var = ecs_rule_variable(&it, i);
            char *var_value = ecs_get_fullpath(world, var);
            ecs_strbuf_list_append(reply, "\"%s\"", var_value);
            ecs_os_free(var_value);
        }
        ecs_strbuf_list_pop(reply, "]");

        /* Output entities */
        ecs_strbuf_list_appendstr(reply, "\"entities\":");
        ecs_strbuf_list_push(reply, "[", ",");
        for (int i = 0; i < it.count; i ++) {
            char *var_value = ecs_get_fullpath(world, it.entities[i]);
            ecs_strbuf_list_append(reply, "\"%s\"", var_value);
            ecs_os_free(var_value);
        }
        ecs_strbuf_list_pop(reply, "]");

        /* End result */
        ecs_strbuf_list_pop(reply, "}");
    }

    ecs_strbuf_list_pop(reply, "]");
}

static
void reply_term_id(ecs_strbuf_t *reply, const ecs_term_id_t *term_id) {
    ecs_strbuf_list_push(reply, "{", ",");
    char *name = NULL;

    if (term_id->entity) {
        name = ecs_get_fullpath(world, term_id->entity);
    } else {
        name = term_id->name;
    }

    ecs_strbuf_list_append(reply, "\"name\":\"%s\"", name);

    if (term_id->var == EcsVarIsVariable || term_id->entity == EcsThis) {
        ecs_strbuf_list_appendstr(reply, "\"is_var\":true");
    }

    ecs_strbuf_list_appendstr(reply, "\"set\":");
    ecs_strbuf_list_push(reply, "{", ",");

    ecs_strbuf_list_appendstr(reply, "\"mask\":\"");
    ecs_strbuf_list_push(reply, "", "|");
    if (term_id->set.mask & EcsSelf) {
        ecs_strbuf_list_appendstr(reply, "self");
    }
    if (term_id->set.mask & EcsSuperSet) {
        ecs_strbuf_list_appendstr(reply, "super");
    }
    if (term_id->set.mask & EcsSubSet) {
        ecs_strbuf_list_appendstr(reply, "sub");
    }
    if (term_id->set.mask & EcsCascade) {
        ecs_strbuf_list_appendstr(reply, "cascade");
    }
    ecs_strbuf_list_pop(reply, NULL);
    ecs_strbuf_appendstr(reply, "\"");

    if (term_id->set.relation) {
        char *rel = ecs_get_fullpath(world, term_id->set.relation);
        ecs_strbuf_list_append(reply, "\"relation\":\"%s\"", rel);
        ecs_os_free(rel);
    }

    ecs_strbuf_list_pop(reply, "}");
    
    ecs_strbuf_list_pop(reply, "}");
}

static
void reply_term(ecs_strbuf_t *reply, const ecs_term_t *term) {
    ecs_strbuf_list_next(reply);
    ecs_strbuf_list_push(reply, "{", ",");

    ecs_strbuf_list_appendstr(reply, "\"pred\":");
    reply_term_id(reply, &term->pred);

    if (ecs_term_id_is_set(&term->subj)) {
        ecs_strbuf_list_appendstr(reply, "\"subj\":");
        reply_term_id(reply, &term->subj);
    }

    if (ecs_term_id_is_set(&term->obj)) {
        ecs_strbuf_list_appendstr(reply, "\"obj\":");
        reply_term_id(reply, &term->obj);
    }

    ecs_strbuf_list_pop(reply, "}");
}

static
void reply_terms(ecs_strbuf_t *reply, const ecs_filter_t *f) {
    ecs_strbuf_list_appendstr(reply, "\"terms\":");
    ecs_strbuf_list_push(reply, "[", ",");

    for (int i = 0; i < f->term_count; i ++) {
        reply_term(reply, &f->terms[i]);
    }

    ecs_strbuf_list_pop(reply, "]");
}

static
void reply_filter(ecs_strbuf_t *reply, ecs_rule_t *r) {
    const ecs_filter_t *f = ecs_rule_filter(r);

    ecs_strbuf_list_appendstr(reply, "\"filter\":");
    ecs_strbuf_list_push(reply, "{", ",");


    if (f->match_this) {
        ecs_strbuf_list_appendstr(reply, "\"has_this\": true");
    } else {
        ecs_strbuf_list_appendstr(reply, "\"has_this\": false");
    }

    ecs_strbuf_list_append(reply, "\"variable_count\": %d",
        variable_count(r));

    reply_terms(reply, f);

    ecs_strbuf_list_pop(reply, "}");
}

#ifndef __EMSCRIPTEN__
void print_terms(
    ecs_iter_t *it)
{
    for (int i = 0; i < it->term_count; i ++) {
        ecs_id_t id = ecs_term_id(it, i + 1);
        if (!i) {
            printf("Terms: [");
        }
        if (i) {
            printf(", ");
        }

        char *str = ecs_id_str(world, id);
        printf("%d = %s", i, str);
        ecs_os_free(str);
    }

    if (it->count) {
        printf("]\n");
    }
}

void print_variables(
    ecs_rule_t *r,
    ecs_iter_t *it) 
{
    int32_t v, count = 0, var_count = ecs_rule_variable_count(r);

    for (v = 0; v < var_count; v ++) {
        const char *var_name = ecs_rule_variable_name(r, v);
        if (!ecs_rule_variable_is_entity(r, v) 
            || !strcmp(var_name, ".") ||
            var_name[0] == '_') 
        {
            continue;
        }

        if (count > 0) {
            printf(", ");
        }

        count ++;
        if (count == 1) {
            printf("Vars:  [");
        }

        printf("%s = ", var_name);
        printf("%s", ecs_get_name(world, ecs_rule_variable(it, v)));
    }

    if (count) {
        printf("]\n");
    } 
}

void print_rule(ecs_rule_t *r) {
    char *prog = ecs_rule_str(r);
    printf("\n%s\n", prog);
    ecs_os_free(prog);

    ecs_iter_t it = ecs_rule_iter(world, r);
    while (ecs_rule_next(&it)) {
        char *str = ecs_iter_str(&it);
        printf("%s\n", str);
        ecs_os_free(str);
    }
}
#endif

static
void reply_rule(ecs_strbuf_t *reply, const char *q) {
    ecs_rule_t *r = ecs_rule_init(world, &(ecs_filter_desc_t) {
        .expr = q
    });

    ecs_strbuf_list_push(reply, "{", ",");

    if (r) {
        ecs_strbuf_list_appendstr(reply, "\"valid\": true");

        reply_filter(reply, r);
        reply_variables(reply, r);
        reply_results(reply, r);

#ifndef __EMSCRIPTEN__
        print_rule(r);
#endif

        ecs_rule_fini(r);
    } else {
        ecs_strbuf_list_appendstr(reply, "\"valid\": false");

        char *err = get_error();
        ecs_strbuf_list_append(reply, "\"error\": \"%s\"", err);
        ecs_os_free(err);
    }

    ecs_strbuf_list_pop(reply, "}");
}


// External functions

EMSCRIPTEN_KEEPALIVE
void init() {
    ecs_os_set_api_defaults();
    ecs_os_api_t api = ecs_os_api;
    api.log_error_ = capture_error;
    ecs_os_set_api(&api);

    ecs_tracing_color_enable(false);

    world = ecs_mini();
    if (!world) {
        ecs_err("failed to create world");
        return;
    }

    ECS_IMPORT(world, FlecsMeta);
    ECS_IMPORT(world, FlecsDoc);
    ECS_IMPORT(world, FlecsCoreDoc);

    ecs_plecs_from_file(world, "etc/assets/db.plecs");
}

EMSCRIPTEN_KEEPALIVE
char* query(char *q) {
    ecs_strbuf_t reply = ECS_STRBUF_INIT;
    reply_rule(&reply, q);
    char *result = ecs_strbuf_get(&reply);
    return result;
}

EMSCRIPTEN_KEEPALIVE
char* get_entity(char *path) {
    ecs_strbuf_t reply = ECS_STRBUF_INIT;

    ecs_entity_t ent = ecs_lookup_path(world, 0, path);

    if (ecs_entity_to_json_buf(world, ent, &reply) != 0) {
        ecs_strbuf_reset(&reply);
        return ecs_os_strdup("{\"valid\": false}");
    }

    return ecs_strbuf_get(&reply);
}

EMSCRIPTEN_KEEPALIVE
char* run(char *plecs) {
    ecs_strbuf_t reply = ECS_STRBUF_INIT;

    ecs_fini(world);

    init();

    ecs_strbuf_list_push(&reply, "{", ",");

    int res = ecs_plecs_from_str(world, NULL, plecs);
    char *err = get_error();

    if (res || err) {
        ecs_strbuf_list_appendstr(&reply, "\"valid\": false");
        ecs_strbuf_list_append(&reply, "\"error\": \"%s\"", err);
        ecs_os_free(err);
    } else {
        ecs_strbuf_list_appendstr(&reply, "\"valid\": true");
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
