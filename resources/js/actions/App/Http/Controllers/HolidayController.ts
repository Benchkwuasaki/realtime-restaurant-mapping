import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\HolidayController::index
 * @see app/Http/Controllers/HolidayController.php:13
 * @route '/holiday'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/holiday',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HolidayController::index
 * @see app/Http/Controllers/HolidayController.php:13
 * @route '/holiday'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HolidayController::index
 * @see app/Http/Controllers/HolidayController.php:13
 * @route '/holiday'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HolidayController::index
 * @see app/Http/Controllers/HolidayController.php:13
 * @route '/holiday'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\HolidayController::index
 * @see app/Http/Controllers/HolidayController.php:13
 * @route '/holiday'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\HolidayController::index
 * @see app/Http/Controllers/HolidayController.php:13
 * @route '/holiday'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\HolidayController::index
 * @see app/Http/Controllers/HolidayController.php:13
 * @route '/holiday'
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
* @see \App\Http\Controllers\HolidayController::create
 * @see app/Http/Controllers/HolidayController.php:39
 * @route '/holiday/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/holiday/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HolidayController::create
 * @see app/Http/Controllers/HolidayController.php:39
 * @route '/holiday/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HolidayController::create
 * @see app/Http/Controllers/HolidayController.php:39
 * @route '/holiday/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HolidayController::create
 * @see app/Http/Controllers/HolidayController.php:39
 * @route '/holiday/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\HolidayController::create
 * @see app/Http/Controllers/HolidayController.php:39
 * @route '/holiday/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\HolidayController::create
 * @see app/Http/Controllers/HolidayController.php:39
 * @route '/holiday/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\HolidayController::create
 * @see app/Http/Controllers/HolidayController.php:39
 * @route '/holiday/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\HolidayController::store
 * @see app/Http/Controllers/HolidayController.php:52
 * @route '/holiday'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/holiday',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\HolidayController::store
 * @see app/Http/Controllers/HolidayController.php:52
 * @route '/holiday'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HolidayController::store
 * @see app/Http/Controllers/HolidayController.php:52
 * @route '/holiday'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\HolidayController::store
 * @see app/Http/Controllers/HolidayController.php:52
 * @route '/holiday'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\HolidayController::store
 * @see app/Http/Controllers/HolidayController.php:52
 * @route '/holiday'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\HolidayController::show
 * @see app/Http/Controllers/HolidayController.php:0
 * @route '/holiday/{holiday}'
 */
export const show = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/holiday/{holiday}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HolidayController::show
 * @see app/Http/Controllers/HolidayController.php:0
 * @route '/holiday/{holiday}'
 */
show.url = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { holiday: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'holiday_id' in args) {
            args = { holiday: args.holiday_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    holiday: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        holiday: typeof args.holiday === 'object'
                ? args.holiday.holiday_id
                : args.holiday,
                }

    return show.definition.url
            .replace('{holiday}', parsedArgs.holiday.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HolidayController::show
 * @see app/Http/Controllers/HolidayController.php:0
 * @route '/holiday/{holiday}'
 */
show.get = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HolidayController::show
 * @see app/Http/Controllers/HolidayController.php:0
 * @route '/holiday/{holiday}'
 */
show.head = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\HolidayController::show
 * @see app/Http/Controllers/HolidayController.php:0
 * @route '/holiday/{holiday}'
 */
    const showForm = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\HolidayController::show
 * @see app/Http/Controllers/HolidayController.php:0
 * @route '/holiday/{holiday}'
 */
        showForm.get = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\HolidayController::show
 * @see app/Http/Controllers/HolidayController.php:0
 * @route '/holiday/{holiday}'
 */
        showForm.head = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\HolidayController::edit
 * @see app/Http/Controllers/HolidayController.php:67
 * @route '/holiday/{holiday}/edit'
 */
export const edit = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/holiday/{holiday}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HolidayController::edit
 * @see app/Http/Controllers/HolidayController.php:67
 * @route '/holiday/{holiday}/edit'
 */
edit.url = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { holiday: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'holiday_id' in args) {
            args = { holiday: args.holiday_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    holiday: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        holiday: typeof args.holiday === 'object'
                ? args.holiday.holiday_id
                : args.holiday,
                }

    return edit.definition.url
            .replace('{holiday}', parsedArgs.holiday.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HolidayController::edit
 * @see app/Http/Controllers/HolidayController.php:67
 * @route '/holiday/{holiday}/edit'
 */
edit.get = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HolidayController::edit
 * @see app/Http/Controllers/HolidayController.php:67
 * @route '/holiday/{holiday}/edit'
 */
edit.head = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\HolidayController::edit
 * @see app/Http/Controllers/HolidayController.php:67
 * @route '/holiday/{holiday}/edit'
 */
    const editForm = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\HolidayController::edit
 * @see app/Http/Controllers/HolidayController.php:67
 * @route '/holiday/{holiday}/edit'
 */
        editForm.get = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\HolidayController::edit
 * @see app/Http/Controllers/HolidayController.php:67
 * @route '/holiday/{holiday}/edit'
 */
        editForm.head = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\HolidayController::update
 * @see app/Http/Controllers/HolidayController.php:87
 * @route '/holiday/{holiday}'
 */
export const update = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/holiday/{holiday}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\HolidayController::update
 * @see app/Http/Controllers/HolidayController.php:87
 * @route '/holiday/{holiday}'
 */
update.url = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { holiday: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'holiday_id' in args) {
            args = { holiday: args.holiday_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    holiday: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        holiday: typeof args.holiday === 'object'
                ? args.holiday.holiday_id
                : args.holiday,
                }

    return update.definition.url
            .replace('{holiday}', parsedArgs.holiday.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HolidayController::update
 * @see app/Http/Controllers/HolidayController.php:87
 * @route '/holiday/{holiday}'
 */
update.put = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\HolidayController::update
 * @see app/Http/Controllers/HolidayController.php:87
 * @route '/holiday/{holiday}'
 */
update.patch = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\HolidayController::update
 * @see app/Http/Controllers/HolidayController.php:87
 * @route '/holiday/{holiday}'
 */
    const updateForm = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\HolidayController::update
 * @see app/Http/Controllers/HolidayController.php:87
 * @route '/holiday/{holiday}'
 */
        updateForm.put = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\HolidayController::update
 * @see app/Http/Controllers/HolidayController.php:87
 * @route '/holiday/{holiday}'
 */
        updateForm.patch = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\HolidayController::destroy
 * @see app/Http/Controllers/HolidayController.php:102
 * @route '/holiday/{holiday}'
 */
export const destroy = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/holiday/{holiday}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\HolidayController::destroy
 * @see app/Http/Controllers/HolidayController.php:102
 * @route '/holiday/{holiday}'
 */
destroy.url = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { holiday: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'holiday_id' in args) {
            args = { holiday: args.holiday_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    holiday: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        holiday: typeof args.holiday === 'object'
                ? args.holiday.holiday_id
                : args.holiday,
                }

    return destroy.definition.url
            .replace('{holiday}', parsedArgs.holiday.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HolidayController::destroy
 * @see app/Http/Controllers/HolidayController.php:102
 * @route '/holiday/{holiday}'
 */
destroy.delete = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\HolidayController::destroy
 * @see app/Http/Controllers/HolidayController.php:102
 * @route '/holiday/{holiday}'
 */
    const destroyForm = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\HolidayController::destroy
 * @see app/Http/Controllers/HolidayController.php:102
 * @route '/holiday/{holiday}'
 */
        destroyForm.delete = (args: { holiday: string | number | { holiday_id: string | number } } | [holiday: string | number | { holiday_id: string | number } ] | string | number | { holiday_id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const HolidayController = { index, create, store, show, edit, update, destroy }

export default HolidayController