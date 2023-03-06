#include "flecs_explorer.h"
#include "stdio.h"
#include <emscripten.h>

// Global world
static ecs_world_t *world;

// REST server
ecs_http_server_t *rest_server;

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
}

static
char* get_error(void) {
    str_set = false;
    char *str = ecs_strbuf_get(&err_buf);
    char *escaped = ecs_astresc('"', str);
    ecs_os_free(str);
    return escaped;
}

EMSCRIPTEN_KEEPALIVE
void init(void) {
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
    ECS_IMPORT(world, FlecsUnits);
    ECS_IMPORT(world, FlecsDoc);
    ECS_IMPORT(world, FlecsCoreDoc);

    /* Create REST server to serve up requests to the explorer */
    rest_server = ecs_rest_server_init(world, NULL);
}

char* reply_request(ecs_http_reply_t *reply) {
    if (reply->code == 200) {
        return ecs_strbuf_get(&reply->body);
    } else {
        char *body = ecs_strbuf_get(&reply->body);
        if (body) {
            return body;
        } else {
            return ecs_asprintf(
                "{\"error\": \"bad request (code %d)\"}", reply->code);
        }
    }
}

EMSCRIPTEN_KEEPALIVE
char* get_request(char *request) {
    ecs_http_reply_t reply = ecs_http_server_get(rest_server, request);
    return reply_request(&reply);
}

EMSCRIPTEN_KEEPALIVE
char* put_request(char *request) {
    ecs_http_reply_t reply = ecs_http_server_put(rest_server, request);
    return reply_request(&reply);
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

        /* Don't return partially initialized world */
        ecs_fini(world);
        init();
    }

    ecs_strbuf_list_pop(&reply, "}");

    return ecs_strbuf_get(&reply);
}
