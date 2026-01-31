#include "flecs_systems_transform.h"

typedef struct {
    ecs_query_t *q_childof;
    ecs_query_t *q_parent;
} transform_queries_t;

static void transform_rot_scale(
    ecs_iter_t *it,
    EcsTransform3 *t) 
{
    EcsRotation3 *r = ecs_field(it, EcsRotation3, 2);
    EcsScale3 *s = ecs_field(it, EcsScale3, 3);
    int i;

    if (r) {
        if (ecs_field_is_self(it, 2)) {
            for (i = 0; i < it->count; i ++) {
                glm_rotate(t[i].value, r[i].x, (vec3){1.0, 0.0, 0.0});
                glm_rotate(t[i].value, r[i].y, (vec3){0.0, 1.0, 0.0});
                glm_rotate(t[i].value, r[i].z, (vec3){0.0, 0.0, 1.0});
            }
        } else {
            for (i = 0; i < it->count; i ++) {
                glm_rotate(t[i].value, r->x, (vec3){1.0, 0.0, 0.0});
                glm_rotate(t[i].value, r->y, (vec3){0.0, 1.0, 0.0});
                glm_rotate(t[i].value, r->z, (vec3){0.0, 0.0, 1.0});
            }
        }
    }

    if (s) {
        for (i = 0; i < it->count; i ++) {
            glm_scale(t[i].value, *(vec3*)&s[i]);
        }
    }
}

static void transform_childof(ecs_iter_t *it) {
    while (ecs_query_next(it)) {
        EcsTransform3 *t = ecs_field(it, EcsTransform3, 0);
        EcsPosition3 *p = ecs_field(it, EcsPosition3, 1);
        EcsTransform3 *t_parent = ecs_field(it, EcsTransform3, 4);
        int i;

        if (!t_parent) {
            if (ecs_field_is_self(it, 1)) {
                for (i = 0; i < it->count; i ++) {
                    glm_translate_make(t[i].value, *(vec3*)&p[i]);
                }
            } else {
                for (i = 0; i < it->count; i ++) {
                    glm_translate_make(t[i].value, *(vec3*)p);
                }
            }
        } else {
            if (ecs_field_is_self(it, 1)) {
                for (i = 0; i < it->count; i ++) {
                    glm_translate_to(t_parent[0].value, *(vec3*)&p[i], t[i].value);
                }
            } else {
                for (i = 0; i < it->count; i ++) {
                    glm_translate_to(t_parent[0].value, *(vec3*)p, t[i].value);
                }
            }
        }

        transform_rot_scale(it, t);
    }
}

static void transform_parent(ecs_iter_t *it) {
    ecs_world_t *world = it->world;

    while (ecs_query_next(it)) {
        EcsTransform3 *t = ecs_field(it, EcsTransform3, 0);
        EcsPosition3 *p = ecs_field(it, EcsPosition3, 1);
        EcsParent *parents = ecs_field(it, EcsParent, 4);
        int i;

        for (i = 0; i < it->count; i ++) {
            ecs_entity_t parent = parents[i].value;
            const EcsTransform3 *t_parent = ecs_get_mut(world, parent, EcsTransform3);
            while (!t_parent) {
                parent = ecs_get_parent(world, parent);
                if (!parent) {
                    break;
                }
                t_parent = ecs_get_mut(world, parent, EcsTransform3);
            }

            if (!t_parent) {
                if (ecs_field_is_self(it, 2)) {
                    glm_translate_make(t[i].value, *(vec3*)&p[i]);
                } else {
                    glm_translate_make(t[i].value, *(vec3*)p);
                }
            } else {
                if (ecs_field_is_self(it, 2)) {
                    glm_translate_to(t_parent[0].value, *(vec3*)&p[i], t[i].value);
                } else {
                    glm_translate_to(t_parent[0].value, *(vec3*)p, t[i].value);
                }
            }
        }

        transform_rot_scale(it, t);
    }
}

void EcsApplyTransform3(ecs_iter_t *it) {
    ecs_world_t *world = it->world;
    transform_queries_t *ctx = it->ctx;

    // {
    //     ecs_iter_t it = ecs_query_iter(world, ctx->q_childof);
    //     transform_childof(&it);
    // }

    for (int depth = 0; depth < 16; depth ++) {
        {
            ecs_iter_t it = ecs_query_iter(world, ctx->q_childof);
            ecs_iter_set_group(&it, depth);
            transform_childof(&it);
        } {
            ecs_iter_t it = ecs_query_iter(world, ctx->q_parent);
            ecs_iter_set_group(&it, depth);
            transform_parent(&it); 
        }
    }
}

void EcsApplyTransformOnce3(ecs_iter_t *it) {
    transform_childof(it);
    ecs_remove_all(it->world, EcsTransformNeeded);
}

void FlecsSystemsTransformImport(
    ecs_world_t *world)
{
    ECS_MODULE(world, FlecsSystemsTransform);
    ECS_IMPORT(world, FlecsComponentsTransform);

    ecs_set_name_prefix(world, "Ecs");

    ecs_add_pair(world, ecs_id(EcsPosition3), EcsWith, ecs_id(EcsTransform3));
    ecs_add_pair(world, ecs_id(EcsRotation3), EcsWith, ecs_id(EcsTransform3));
    ecs_add_pair(world, ecs_id(EcsScale3),    EcsWith, ecs_id(EcsTransform3));

    /* Query for entities with ChildOf pairs */
    ecs_query_desc_t q_childof = {
        .entity = ecs_entity(world, { .name = "TransformChildOfQuery" }),
        .terms = {{ 
            .id = ecs_id(EcsTransform3),
            .inout = EcsOut,
        }, {
            .id = ecs_id(EcsPosition3),
            .inout = EcsIn
        }, {
            .id = ecs_id(EcsRotation3),
            .inout = EcsIn,
            .oper = EcsOptional
        }, {
            .id = ecs_id(EcsScale3),
            .inout = EcsIn,
            .oper = EcsOptional
        }, {
            .id = ecs_id(EcsTransform3), 
            .inout = EcsIn,
            .oper = EcsOptional,
            .src.id = EcsCascade
        }, {
            .id = EcsTransformManually,
            .oper = EcsNot
        }, {
            .id = EcsTransformOnce,
            .oper = EcsNot
        }, 
        {
            .id = ecs_id(EcsParent),
            .oper = EcsNot
        }
        },
        .cache_kind = EcsQueryCacheAuto
    };

    /* Query for entities with Parent components */
    ecs_query_desc_t q_parent = q_childof;
    q_parent.entity = ecs_entity(world, { .name = "TransformParentQuery" });
    q_parent.terms[4] = (ecs_term_t) {
        .id = ecs_id(EcsParent),
        .inout = EcsIn
    };

    q_parent.terms[7] = (ecs_term_t) { 0 };

    q_parent.group_by = EcsParentDepth;

    transform_queries_t *ctx = ecs_os_malloc_t(transform_queries_t);
    ctx->q_childof = ecs_query_init(world, &q_childof);
    ctx->q_parent = ecs_query_init(world, &q_parent);

    ecs_system(world, {
        .entity = ecs_entity(world, { 
            .name = "EcsApplyTransform3",
            .add = ecs_ids( ecs_dependson(EcsOnValidate) )
        }),
        .run = EcsApplyTransform3,
        .ctx = ctx
    });

    ecs_system(world, {
        .entity = ecs_entity(world, { 
            .name = "EcsApplyTransformOnce3",
            .add = ecs_ids( ecs_dependson(EcsOnValidate) )
        }),
        .query = {
            .terms = {{ 
                .id = ecs_id(EcsTransform3),
                .inout = EcsOut,
            }, {
                .id = ecs_id(EcsPosition3),
                .inout = EcsIn
            }, {
                .id = ecs_id(EcsRotation3),
                .inout = EcsIn,
                .oper = EcsOptional
            }, {
                .id = ecs_id(EcsScale3),
                .inout = EcsIn,
                .oper = EcsOptional
            }, {
                .id = ecs_id(EcsTransform3), 
                .inout = EcsIn,
                .oper = EcsOptional,
                .src.id = EcsCascade
            }, {
                .id = EcsTransformOnce
            }, {
                .id = EcsTransformNeeded
            }, {
                .id = EcsTransformManually,
                .oper = EcsNot
            }}
        },
        .run = EcsApplyTransformOnce3
    });
}

