#include "flecs_explorer.h"
#include "stdio.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

void PlaygroundImport(ecs_world_t *world) {
    ECS_MODULE(world, Playground);

    // ECS_IMPORT(world, FlecsUnits);
    ECS_IMPORT(world, FlecsScript);
    ECS_IMPORT(world, FlecsScriptMath);
    ECS_IMPORT(world, FlecsComponentsTransform);
    ECS_IMPORT(world, FlecsComponentsGeometry);
    ECS_IMPORT(world, FlecsComponentsGui);
    ECS_IMPORT(world, FlecsComponentsGraphics);
    ECS_IMPORT(world, FlecsSystemsTransform);
    ECS_IMPORT(world, FlecsSystemsSokol);
    ECS_IMPORT(world, FlecsGame);
}

EMSCRIPTEN_KEEPALIVE
int main() {
    // ecs_log_set_level(1);

    ecs_world_t *world = ecs_init();
    if (!world) {
        ecs_err("failed to create world");
        return -1;
    }

    ECS_IMPORT(world, Playground);

    ecs_doc_set_name(world, EcsWorld, "Playground");

    // Load scripts

    // Don't load as managed script, as we don't want people to modify the 
    // contents of this file in the explorer.
    ecs_script_run_file(world, "etc/assets/app.flecs");

    // Load as managed script, so it can be modified at runtime.
    ecs_script(world, {
        .filename = "etc/assets/scene.flecs"
    });

    return ecs_app_run(world, &(ecs_app_desc_t){
        .enable_rest = true,
        .enable_stats = true,
        .target_fps = 60
    });
}
