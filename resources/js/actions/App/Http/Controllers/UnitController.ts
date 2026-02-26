import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\UnitController::index
 * @see app/Http/Controllers/UnitController.php:14
 * @route '/organization/units'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/organization/units',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UnitController::index
 * @see app/Http/Controllers/UnitController.php:14
 * @route '/organization/units'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnitController::index
 * @see app/Http/Controllers/UnitController.php:14
 * @route '/organization/units'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UnitController::index
 * @see app/Http/Controllers/UnitController.php:14
 * @route '/organization/units'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UnitController::index
 * @see app/Http/Controllers/UnitController.php:14
 * @route '/organization/units'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UnitController::index
 * @see app/Http/Controllers/UnitController.php:14
 * @route '/organization/units'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UnitController::index
 * @see app/Http/Controllers/UnitController.php:14
 * @route '/organization/units'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\UnitController::show
 * @see app/Http/Controllers/UnitController.php:40
 * @route '/organization/units/{unit}'
 */
export const show = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/organization/units/{unit}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UnitController::show
 * @see app/Http/Controllers/UnitController.php:40
 * @route '/organization/units/{unit}'
 */
show.url = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { unit: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'unit_id' in args) {
            args = { unit: args.unit_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    unit: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        unit: typeof args.unit === 'object'
                ? args.unit.unit_id
                : args.unit,
                }

    return show.definition.url
            .replace('{unit}', parsedArgs.unit.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnitController::show
 * @see app/Http/Controllers/UnitController.php:40
 * @route '/organization/units/{unit}'
 */
show.get = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UnitController::show
 * @see app/Http/Controllers/UnitController.php:40
 * @route '/organization/units/{unit}'
 */
show.head = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UnitController::show
 * @see app/Http/Controllers/UnitController.php:40
 * @route '/organization/units/{unit}'
 */
    const showForm = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UnitController::show
 * @see app/Http/Controllers/UnitController.php:40
 * @route '/organization/units/{unit}'
 */
        showForm.get = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UnitController::show
 * @see app/Http/Controllers/UnitController.php:40
 * @route '/organization/units/{unit}'
 */
        showForm.head = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\UnitController::store
 * @see app/Http/Controllers/UnitController.php:63
 * @route '/organization/units'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/organization/units',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UnitController::store
 * @see app/Http/Controllers/UnitController.php:63
 * @route '/organization/units'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnitController::store
 * @see app/Http/Controllers/UnitController.php:63
 * @route '/organization/units'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UnitController::store
 * @see app/Http/Controllers/UnitController.php:63
 * @route '/organization/units'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnitController::store
 * @see app/Http/Controllers/UnitController.php:63
 * @route '/organization/units'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\UnitController::update
 * @see app/Http/Controllers/UnitController.php:78
 * @route '/organization/units/{unit}'
 */
export const update = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/organization/units/{unit}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\UnitController::update
 * @see app/Http/Controllers/UnitController.php:78
 * @route '/organization/units/{unit}'
 */
update.url = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { unit: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'unit_id' in args) {
            args = { unit: args.unit_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    unit: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        unit: typeof args.unit === 'object'
                ? args.unit.unit_id
                : args.unit,
                }

    return update.definition.url
            .replace('{unit}', parsedArgs.unit.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnitController::update
 * @see app/Http/Controllers/UnitController.php:78
 * @route '/organization/units/{unit}'
 */
update.put = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\UnitController::update
 * @see app/Http/Controllers/UnitController.php:78
 * @route '/organization/units/{unit}'
 */
    const updateForm = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnitController::update
 * @see app/Http/Controllers/UnitController.php:78
 * @route '/organization/units/{unit}'
 */
        updateForm.put = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\UnitController::bulkDestroy
 * @see app/Http/Controllers/UnitController.php:101
 * @route '/organization/units/bulk-destroy'
 */
export const bulkDestroy = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDestroy.url(options),
    method: 'delete',
})

bulkDestroy.definition = {
    methods: ["delete"],
    url: '/organization/units/bulk-destroy',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UnitController::bulkDestroy
 * @see app/Http/Controllers/UnitController.php:101
 * @route '/organization/units/bulk-destroy'
 */
bulkDestroy.url = (options?: RouteQueryOptions) => {
    return bulkDestroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnitController::bulkDestroy
 * @see app/Http/Controllers/UnitController.php:101
 * @route '/organization/units/bulk-destroy'
 */
bulkDestroy.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDestroy.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UnitController::bulkDestroy
 * @see app/Http/Controllers/UnitController.php:101
 * @route '/organization/units/bulk-destroy'
 */
    const bulkDestroyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkDestroy.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnitController::bulkDestroy
 * @see app/Http/Controllers/UnitController.php:101
 * @route '/organization/units/bulk-destroy'
 */
        bulkDestroyForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkDestroy.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    bulkDestroy.form = bulkDestroyForm
/**
* @see \App\Http\Controllers\UnitController::destroy
 * @see app/Http/Controllers/UnitController.php:93
 * @route '/organization/units/{unit}'
 */
export const destroy = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/organization/units/{unit}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UnitController::destroy
 * @see app/Http/Controllers/UnitController.php:93
 * @route '/organization/units/{unit}'
 */
destroy.url = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { unit: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'unit_id' in args) {
            args = { unit: args.unit_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    unit: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        unit: typeof args.unit === 'object'
                ? args.unit.unit_id
                : args.unit,
                }

    return destroy.definition.url
            .replace('{unit}', parsedArgs.unit.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnitController::destroy
 * @see app/Http/Controllers/UnitController.php:93
 * @route '/organization/units/{unit}'
 */
destroy.delete = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UnitController::destroy
 * @see app/Http/Controllers/UnitController.php:93
 * @route '/organization/units/{unit}'
 */
    const destroyForm = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnitController::destroy
 * @see app/Http/Controllers/UnitController.php:93
 * @route '/organization/units/{unit}'
 */
        destroyForm.delete = (args: { unit: number | { unit_id: number } } | [unit: number | { unit_id: number } ] | number | { unit_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const UnitController = { index, show, store, update, bulkDestroy, destroy }

export default UnitController