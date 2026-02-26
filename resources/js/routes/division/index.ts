import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\DivisionController::index
 * @see app/Http/Controllers/DivisionController.php:14
 * @route '/organization/divisions'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/organization/divisions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DivisionController::index
 * @see app/Http/Controllers/DivisionController.php:14
 * @route '/organization/divisions'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DivisionController::index
 * @see app/Http/Controllers/DivisionController.php:14
 * @route '/organization/divisions'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\DivisionController::index
 * @see app/Http/Controllers/DivisionController.php:14
 * @route '/organization/divisions'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\DivisionController::index
 * @see app/Http/Controllers/DivisionController.php:14
 * @route '/organization/divisions'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\DivisionController::index
 * @see app/Http/Controllers/DivisionController.php:14
 * @route '/organization/divisions'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\DivisionController::index
 * @see app/Http/Controllers/DivisionController.php:14
 * @route '/organization/divisions'
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
* @see \App\Http\Controllers\DivisionController::show
 * @see app/Http/Controllers/DivisionController.php:40
 * @route '/organization/divisions/{division}'
 */
export const show = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/organization/divisions/{division}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DivisionController::show
 * @see app/Http/Controllers/DivisionController.php:40
 * @route '/organization/divisions/{division}'
 */
show.url = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { division: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'division_id' in args) {
            args = { division: args.division_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    division: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        division: typeof args.division === 'object'
                ? args.division.division_id
                : args.division,
                }

    return show.definition.url
            .replace('{division}', parsedArgs.division.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DivisionController::show
 * @see app/Http/Controllers/DivisionController.php:40
 * @route '/organization/divisions/{division}'
 */
show.get = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\DivisionController::show
 * @see app/Http/Controllers/DivisionController.php:40
 * @route '/organization/divisions/{division}'
 */
show.head = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\DivisionController::show
 * @see app/Http/Controllers/DivisionController.php:40
 * @route '/organization/divisions/{division}'
 */
    const showForm = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\DivisionController::show
 * @see app/Http/Controllers/DivisionController.php:40
 * @route '/organization/divisions/{division}'
 */
        showForm.get = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\DivisionController::show
 * @see app/Http/Controllers/DivisionController.php:40
 * @route '/organization/divisions/{division}'
 */
        showForm.head = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\DivisionController::store
 * @see app/Http/Controllers/DivisionController.php:63
 * @route '/organization/divisions'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/organization/divisions',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DivisionController::store
 * @see app/Http/Controllers/DivisionController.php:63
 * @route '/organization/divisions'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DivisionController::store
 * @see app/Http/Controllers/DivisionController.php:63
 * @route '/organization/divisions'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\DivisionController::store
 * @see app/Http/Controllers/DivisionController.php:63
 * @route '/organization/divisions'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DivisionController::store
 * @see app/Http/Controllers/DivisionController.php:63
 * @route '/organization/divisions'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\DivisionController::update
 * @see app/Http/Controllers/DivisionController.php:78
 * @route '/organization/divisions/{division}'
 */
export const update = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/organization/divisions/{division}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\DivisionController::update
 * @see app/Http/Controllers/DivisionController.php:78
 * @route '/organization/divisions/{division}'
 */
update.url = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { division: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'division_id' in args) {
            args = { division: args.division_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    division: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        division: typeof args.division === 'object'
                ? args.division.division_id
                : args.division,
                }

    return update.definition.url
            .replace('{division}', parsedArgs.division.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DivisionController::update
 * @see app/Http/Controllers/DivisionController.php:78
 * @route '/organization/divisions/{division}'
 */
update.put = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\DivisionController::update
 * @see app/Http/Controllers/DivisionController.php:78
 * @route '/organization/divisions/{division}'
 */
    const updateForm = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DivisionController::update
 * @see app/Http/Controllers/DivisionController.php:78
 * @route '/organization/divisions/{division}'
 */
        updateForm.put = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\DivisionController::bulkDestroy
 * @see app/Http/Controllers/DivisionController.php:101
 * @route '/organization/divisions/bulk-destroy'
 */
export const bulkDestroy = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDestroy.url(options),
    method: 'delete',
})

bulkDestroy.definition = {
    methods: ["delete"],
    url: '/organization/divisions/bulk-destroy',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\DivisionController::bulkDestroy
 * @see app/Http/Controllers/DivisionController.php:101
 * @route '/organization/divisions/bulk-destroy'
 */
bulkDestroy.url = (options?: RouteQueryOptions) => {
    return bulkDestroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DivisionController::bulkDestroy
 * @see app/Http/Controllers/DivisionController.php:101
 * @route '/organization/divisions/bulk-destroy'
 */
bulkDestroy.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDestroy.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\DivisionController::bulkDestroy
 * @see app/Http/Controllers/DivisionController.php:101
 * @route '/organization/divisions/bulk-destroy'
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
* @see \App\Http\Controllers\DivisionController::bulkDestroy
 * @see app/Http/Controllers/DivisionController.php:101
 * @route '/organization/divisions/bulk-destroy'
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
* @see \App\Http\Controllers\DivisionController::destroy
 * @see app/Http/Controllers/DivisionController.php:93
 * @route '/organization/divisions/{division}'
 */
export const destroy = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/organization/divisions/{division}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\DivisionController::destroy
 * @see app/Http/Controllers/DivisionController.php:93
 * @route '/organization/divisions/{division}'
 */
destroy.url = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { division: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'division_id' in args) {
            args = { division: args.division_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    division: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        division: typeof args.division === 'object'
                ? args.division.division_id
                : args.division,
                }

    return destroy.definition.url
            .replace('{division}', parsedArgs.division.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DivisionController::destroy
 * @see app/Http/Controllers/DivisionController.php:93
 * @route '/organization/divisions/{division}'
 */
destroy.delete = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\DivisionController::destroy
 * @see app/Http/Controllers/DivisionController.php:93
 * @route '/organization/divisions/{division}'
 */
    const destroyForm = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DivisionController::destroy
 * @see app/Http/Controllers/DivisionController.php:93
 * @route '/organization/divisions/{division}'
 */
        destroyForm.delete = (args: { division: number | { division_id: number } } | [division: number | { division_id: number } ] | number | { division_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const division = {
    index: Object.assign(index, index),
show: Object.assign(show, show),
store: Object.assign(store, store),
update: Object.assign(update, update),
bulkDestroy: Object.assign(bulkDestroy, bulkDestroy),
destroy: Object.assign(destroy, destroy),
}

export default division