#include "flecs_explorer.h"
#include "stdio.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

EMSCRIPTEN_KEEPALIVE
int main(void) {
    ecs_log_set_level(0);
    ecs_world_t *world = ecs_mini();
    if (!world) {
        ecs_err("failed to create world");
        return -1;
    }

    /* Import basic modules for serialization */
    ECS_IMPORT(world, FlecsMeta);
    ECS_IMPORT(world, FlecsUnits);
    ECS_IMPORT(world, FlecsDoc);
    ECS_IMPORT(world, FlecsRest);
    ECS_IMPORT(world, FlecsStats);
    ECS_IMPORT(world, FlecsAlerts);
    ECS_IMPORT(world, FlecsStats);

    ecs_doc_set_name(world, EcsWorld, "Flecs Playground");

    // Load script for editor
    ecs_script(world, {
        .entity = ecs_entity(world, { .name = "scripts.main" }),
        .filename = "etc/assets/main.flecs"
    });

    // Run for 1 frame to initialize REST API while not blocking web app
    return ecs_app_run(world, &(ecs_app_desc_t){
        .enable_rest = true,
        .frames = 1
    });
}
