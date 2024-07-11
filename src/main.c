#include "flecs_explorer.h"
#include "stdio.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

#define PI 3.1415926

typedef struct {
    ecs_entity_t particle;
    float spawn_interval;
    float lifespan;
    float size_decay;
    float color_decay;
    float velocity_decay;
    float t;
} ParticleEmitter;

typedef struct {
    float t;
} Particle;

ECS_COMPONENT_DECLARE(ParticleEmitter);
ECS_COMPONENT_DECLARE(Particle);

ECS_CTOR(ParticleEmitter, ptr, {
    ptr->particle = 0;
    ptr->spawn_interval = 1.0;
    ptr->lifespan = 1000.0;
    ptr->size_decay = 1.0;
    ptr->color_decay = 1.0;
    ptr->velocity_decay = 1.0;
    ptr->t = 0;
})

float randf(float scale) {
    return ((float)rand() / (float)RAND_MAX) * scale;
}

void ParticleEmit(ecs_iter_t *it) {
    ParticleEmitter *e = ecs_field(it, ParticleEmitter, 0);
    EcsBox *box = ecs_field(it, EcsBox, 1);

    for (int i = 0; i < it->count; i ++) {
        e[i].t += it->delta_time;
        if (e[i].t > e[i].spawn_interval) {
            e[i].t -= e[i].spawn_interval;

            ecs_entity_t p = ecs_insert(it->world, 
                {ecs_childof(it->entities[i])},
                {ecs_isa(e[i].particle)},
                ecs_value(Particle, {
                    .t = e[i].lifespan
                }));

            if (box) {
                EcsPosition3 pos = {0, 0, 0};
                pos.x = randf(box[i].width) - box[i].width / 2;
                pos.y = randf(box[i].height) - box[i].height / 2;
                pos.z = randf(box[i].depth) - box[i].depth / 2;
                ecs_set_ptr(it->world, p, EcsPosition3, &pos);
            }

            ecs_set(it->world, p, EcsRotation3, { 0, randf(4 * 3.1415926), 0 });
        }
    }
}

void ParticleProgress(ecs_iter_t *it) {
    Particle *p = ecs_field(it, Particle, 0);
    ParticleEmitter *e = ecs_field(it, ParticleEmitter, 1);
    EcsBox *box = ecs_field(it, EcsBox, 2);
    EcsRgb *color = ecs_field(it, EcsRgb, 3);
    EcsVelocity3 *vel = ecs_field(it, EcsVelocity3, 4);

    for (int i = 0; i < it->count; i ++) {
        p[i].t -= it->delta_time;
        if (p[i].t <= 0) {
            ecs_delete(it->world, it->entities[i]);
        }
    }

    if (box) {
        for (int i = 0; i < it->count; i ++) {
            box[i].width *= pow(e[i].size_decay, it->delta_time);
            box[i].height *= pow(e[i].size_decay, it->delta_time);
            box[i].depth *= pow(e[i].size_decay, it->delta_time);

            if ((box[i].width + box[i].height + box[i].depth) < 0.1) {
                ecs_delete(it->world, it->entities[i]);
            }
        }
    }
    if (color) {
        for (int i = 0; i < it->count; i ++) {
            color[i].r *= pow(e[i].color_decay, it->delta_time);
            color[i].g *= pow(e[i].color_decay, it->delta_time);
            color[i].b *= pow(e[i].color_decay, it->delta_time);
        } 
    }
    if (vel) {
        for (int i = 0; i < it->count; i ++) {
            vel[i].x *= pow(e[i].velocity_decay, it->delta_time);
            vel[i].y *= pow(e[i].velocity_decay, it->delta_time);
            vel[i].z *= pow(e[i].velocity_decay, it->delta_time);
        }
    }
}

EMSCRIPTEN_KEEPALIVE
int main(void) {
    ecs_log_set_level(0);
    ecs_world_t *world = ecs_init();
    if (!world) {
        ecs_err("failed to create world");
        return -1;
    }

    ECS_IMPORT(world, FlecsUnits);
    ECS_IMPORT(world, FlecsScript);
    ECS_IMPORT(world, FlecsComponentsTransform);
    ECS_IMPORT(world, FlecsComponentsGeometry);
    ECS_IMPORT(world, FlecsComponentsGui);
    ECS_IMPORT(world, FlecsComponentsGraphics);
    ECS_IMPORT(world, FlecsSystemsTransform);
    ECS_IMPORT(world, FlecsSystemsSokol);
    ECS_IMPORT(world, FlecsGame);
    
    ECS_COMPONENT_DEFINE(world, ParticleEmitter);
    ECS_COMPONENT_DEFINE(world, Particle);

    ecs_set_hooks(world, ParticleEmitter, {
        .ctor = ecs_ctor(ParticleEmitter)
    });

    ecs_struct(world, {
        .entity = ecs_id(ParticleEmitter),
        .members = {
            { .name = "particle", .type = ecs_id(ecs_entity_t) },
            { .name = "spawn_interval", .type = ecs_id(ecs_f32_t) },
            { .name = "lifespan", .type = ecs_id(ecs_f32_t) },
            { .name = "size_decay", .type = ecs_id(ecs_f32_t) },
            { .name = "color_decay", .type = ecs_id(ecs_f32_t) },
            { .name = "velocity_decay", .type = ecs_id(ecs_f32_t) },
            { .name = "t", .type = ecs_id(ecs_f32_t) },
        }
    });

    // Particle systems
    ECS_SYSTEM(world, ParticleEmit, EcsOnUpdate, 
        ParticleEmitter,
        ?flecs.components.geometry.Box);

    ECS_SYSTEM(world, ParticleProgress, EcsOnUpdate, 
        Particle, 
        ParticleEmitter(up),
        ?flecs.components.geometry.Box(self),
        ?flecs.components.graphics.Rgb(self),
        ?flecs.components.physics.Velocity3(self));

    // Load scripts
    ecs_script(world, {
        .filename = "etc/assets/app.flecs"
    });

    ecs_script(world, {
        .filename = "etc/assets/scene.flecs"
    });

    return ecs_app_run(world, &(ecs_app_desc_t){
        .enable_rest = true,
        .enable_stats = true
    });
}
