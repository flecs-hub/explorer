#include "flecs_explorer.h"
#include "stdio.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

#define PLAYGROUND_SCENE "etc/scenes/town.flecs"
#define PLAYGROUND_SCENE_ENTITY "etc.scenes.town\\.flecs"

#ifdef __EMSCRIPTEN__
EM_JS(bool, has_startup_script_param, (), {
    if (typeof window === "undefined" || typeof URLSearchParams === "undefined") {
        return false;
    }

    const params = new URLSearchParams(window.location.search || "");
    return params.has("code") || params.has("code_url");
});

EM_JS(void, playground_canvas_size, (float *out), {
    const canvas = document.getElementById("canvas");
    HEAPF32[out >> 2] = canvas ? canvas.clientWidth : 0;
    HEAPF32[(out >> 2) + 1] = canvas ? canvas.clientHeight : 0;
    HEAPF32[(out >> 2) + 2] = window.devicePixelRatio || 1;
});
#else
static
bool has_startup_script_param(void) {
    return false;
}

static
void playground_canvas_size(float *out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 1;
}
#endif

EMSCRIPTEN_KEEPALIVE
bool flecs_explorer_has_canvas(void) {
    return true;
}

static
void PlaygroundCanvasResize(ecs_iter_t *it) {
    Surface *surface = ecs_field(it, Surface, 0);
    float size[3];
    playground_canvas_size(size);

    int32_t width = (int32_t)size[0];
    int32_t height = (int32_t)size[1];
    if (width <= 0 || height <= 0 || !it->count) {
        return;
    }

    Surface *s = &surface[0];
    if (s->width == width && s->height == height && s->pixel_ratio == size[2]) {
        return;
    }

    s->width = width;
    s->height = height;
    s->pixel_ratio = size[2];
    ecs_modified(it->world, it->entities[0], Surface);
}

static
int playground_run(
    ecs_world_t *world,
    ecs_app_desc_t *desc)
{
    (void)desc;
    return box_app_run(world);
}

EMSCRIPTEN_KEEPALIVE
int main() {
    ecs_world_t *world = ecs_init();
    if (!world) {
        ecs_err("failed to create world");
        return -1;
    }

    ECS_IMPORT(world, FlecsUnits);
    ECS_IMPORT(world, Box);
    ecs_enable(world, ecs_id(FlecsStats), true);

    ecs_system(world, {
        .entity = ecs_entity(world, { .name = "PlaygroundCanvasResize" }),
        .phase = EcsOnLoad,
        .query.terms = {{ ecs_id(Surface) }},
        .callback = PlaygroundCanvasResize
    });

    ecs_doc_set_name(world, EcsWorld, "Playground");

    if (!has_startup_script_param()) {
        App *app = ecs_singleton_ensure(world, App);
        ecs_os_free(app->scene);
        app->scene = ecs_os_strdup(PLAYGROUND_SCENE);
        ecs_singleton_modified(world, App);
    } else {
        ecs_script(world, {
            .entity = ecs_entity(world, { .name = PLAYGROUND_SCENE_ENTITY }),
            .code = ""
        });
    }

    ecs_app_set_run_action(playground_run);

    return ecs_app_run(world, &(ecs_app_desc_t){
        .enable_rest = true,
        .enable_stats = true
    });
}
