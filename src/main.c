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

#ifdef __EMSCRIPTEN__
EM_JS(bool, has_startup_script_param, (), {
    if (typeof window === "undefined" || typeof URLSearchParams === "undefined") {
        return false;
    }

    const params = new URLSearchParams(window.location.search || "");
    return params.has("code") || params.has("code_url");
});
#else
static
bool has_startup_script_param(void) {
    return false;
}
#endif

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

    // When code/code_url is provided in URL params, startup code will be
    // injected by the frontend. Skip loading the default scene first.
    if (!has_startup_script_param()) {
        // Load as managed script, so it can be modified at runtime.
        ecs_script(world, {
            .filename = "etc/assets/scene.flecs"
        });
    } else {
        ecs_script(world, {
            .entity = ecs_entity(world, { .name = "etc.assets.scene\\.flecs"}),
            .code = ""
        });
    }

    return ecs_app_run(world, &(ecs_app_desc_t){
        .enable_rest = true,
        .enable_stats = true,
        .target_fps = 60
    });
}
