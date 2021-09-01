#include "flecs.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

// Global world
static ecs_world_t *world;

// // Utilities for capturing (parser) errors
// static ecs_strbuf_t err_buf = ECS_STRBUF_INIT;
// bool str_set = false;

// static 
// void capture_error(
//     const char *msg)
// {
//     if (!str_set) {
//         ecs_strbuf_appendstr(&err_buf, msg);
//         str_set = true;
//     }
// }

// static
// char* get_error() {
//     str_set = false;
//     return ecs_strbuf_get(&err_buf);
// }

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
        if (var_name[0] == '_') {
            continue;
        }

        ecs_strbuf_list_append(reply, "\"%s\"", var_name);
    }

    ecs_strbuf_list_pop(reply, "]");
}

static
void reply_results(ecs_strbuf_t *reply, ecs_rule_t *r) {
    ecs_iter_t it = ecs_rule_iter(r);
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

        /* Output variables */
        ecs_strbuf_list_appendstr(reply, "\"variables\":");
        ecs_strbuf_list_push(reply, "[", ",");
        for (int i = 0; i < var_count; i ++) {
            if (!ecs_rule_variable_is_entity(r, i)) {
                continue;
            }
            const char *var_name = ecs_rule_variable_name(r, i);
            if (var_name[0] == '_') {
                continue;
            }                
            ecs_entity_t var = ecs_rule_variable(&it, i);
            const char *var_value = ecs_get_name(world, var);
            ecs_strbuf_list_append(reply, "\"%s\"", var_value);
        }
        ecs_strbuf_list_pop(reply, "]");

        /* Output entities */
        ecs_strbuf_list_appendstr(reply, "\"entities\":");
        ecs_strbuf_list_push(reply, "[", ",");
        for (int i = 0; i < it.count; i ++) {
            const char *var_value = ecs_get_name(world, it.entities[i]);
            ecs_strbuf_list_append(reply, "\"%s\"", var_value);
        }
        ecs_strbuf_list_pop(reply, "]");

        /* End result */
        ecs_strbuf_list_pop(reply, "}");
    }

    ecs_strbuf_list_pop(reply, "]");
}

static
void reply_rule(ecs_strbuf_t *reply, const char *q) {
    ecs_rule_t *r = ecs_rule_init(world, &(ecs_filter_desc_t) {
        .expr = q
    });

    ecs_strbuf_list_push(reply, "{", ",");

    if (r) {
        ecs_strbuf_list_appendstr(reply, "\"valid\": true");

        const ecs_filter_t *f = ecs_rule_filter(r);
        if (f->match_this) {
            ecs_strbuf_list_appendstr(reply, "\"has_this\": true");
        }

        reply_variables(reply, r);
        reply_results(reply, r);
        ecs_rule_fini(r);
    } else {
        ecs_strbuf_list_appendstr(reply, "\"valid\": false");

        // char *err = get_error();
        // ecs_strbuf_list_append(reply, "\"error\": \"%s\"", err);
        // ecs_os_free(err);
    }

    ecs_strbuf_list_pop(reply, "}");
}


// External functions

EMSCRIPTEN_KEEPALIVE
void init() {
    // ecs_os_set_api_defaults();
    // ecs_os_api_t api = ecs_os_api;
    // api.log_error_ = capture_error;
    // ecs_os_set_api(&api);

    ecs_tracing_color_enable(false);

    world = ecs_init();
    if (!world) {
        ecs_err("failed to create world");
        return;
    }

    if (ecs_plecs_from_file(world, "etc/assets/db.plecs")) {
        ecs_err("failed to load db.plecs");
        return;
    }

    ecs_trace(0, "world loaded");
}

EMSCRIPTEN_KEEPALIVE
char* query(char *q) {
    ecs_strbuf_t reply = ECS_STRBUF_INIT;
    reply_rule(&reply, q);
    char *result = ecs_strbuf_get(&reply);
    return result;
}

#ifndef __EMSCRIPTEN__
int main(int argc, char *argv[]) {
    init();

    while (1) {
        char str[1024];
        printf("\n?- ");
        fgets(str, sizeof(str), stdin);

        char *res = query(str);
        printf("%s\n", res);
        ecs_os_free(res);
    }
}
#endif
