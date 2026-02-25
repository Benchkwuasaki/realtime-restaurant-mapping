import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:31
 * @route '/employee'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/employee',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:31
 * @route '/employee'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:31
 * @route '/employee'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:31
 * @route '/employee'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:31
 * @route '/employee'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:31
 * @route '/employee'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:31
 * @route '/employee'
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
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:53
 * @route '/employee/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/employee/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:53
 * @route '/employee/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:53
 * @route '/employee/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:53
 * @route '/employee/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:53
 * @route '/employee/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:53
 * @route '/employee/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:53
 * @route '/employee/create'
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
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:68
 * @route '/employee'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/employee',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:68
 * @route '/employee'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:68
 * @route '/employee'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:68
 * @route '/employee'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:68
 * @route '/employee'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:216
 * @route '/employee/{employee}'
 */
export const show = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/employee/{employee}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:216
 * @route '/employee/{employee}'
 */
show.url = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'employee_id' in args) {
            args = { employee: args.employee_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.employee_id
                : args.employee,
                }

    return show.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:216
 * @route '/employee/{employee}'
 */
show.get = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:216
 * @route '/employee/{employee}'
 */
show.head = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:216
 * @route '/employee/{employee}'
 */
    const showForm = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:216
 * @route '/employee/{employee}'
 */
        showForm.get = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:216
 * @route '/employee/{employee}'
 */
        showForm.head = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:243
 * @route '/employee/{employee}/edit'
 */
export const edit = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/employee/{employee}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:243
 * @route '/employee/{employee}/edit'
 */
edit.url = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'employee_id' in args) {
            args = { employee: args.employee_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.employee_id
                : args.employee,
                }

    return edit.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:243
 * @route '/employee/{employee}/edit'
 */
edit.get = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:243
 * @route '/employee/{employee}/edit'
 */
edit.head = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:243
 * @route '/employee/{employee}/edit'
 */
    const editForm = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:243
 * @route '/employee/{employee}/edit'
 */
        editForm.get = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:243
 * @route '/employee/{employee}/edit'
 */
        editForm.head = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:255
 * @route '/employee/{employee}'
 */
export const update = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/employee/{employee}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:255
 * @route '/employee/{employee}'
 */
update.url = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'employee_id' in args) {
            args = { employee: args.employee_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.employee_id
                : args.employee,
                }

    return update.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:255
 * @route '/employee/{employee}'
 */
update.put = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:255
 * @route '/employee/{employee}'
 */
    const updateForm = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:255
 * @route '/employee/{employee}'
 */
        updateForm.put = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\EmployeeController::toggleStatus
 * @see app/Http/Controllers/EmployeeController.php:321
 * @route '/employee/{employee}/toggle'
 */
export const toggleStatus = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/employee/{employee}/toggle',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\EmployeeController::toggleStatus
 * @see app/Http/Controllers/EmployeeController.php:321
 * @route '/employee/{employee}/toggle'
 */
toggleStatus.url = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'employee_id' in args) {
            args = { employee: args.employee_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.employee_id
                : args.employee,
                }

    return toggleStatus.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::toggleStatus
 * @see app/Http/Controllers/EmployeeController.php:321
 * @route '/employee/{employee}/toggle'
 */
toggleStatus.patch = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\EmployeeController::toggleStatus
 * @see app/Http/Controllers/EmployeeController.php:321
 * @route '/employee/{employee}/toggle'
 */
    const toggleStatusForm = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::toggleStatus
 * @see app/Http/Controllers/EmployeeController.php:321
 * @route '/employee/{employee}/toggle'
 */
        toggleStatusForm.patch = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggleStatus.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    toggleStatus.form = toggleStatusForm
/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:333
 * @route '/employee/{employee}'
 */
export const destroy = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/employee/{employee}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:333
 * @route '/employee/{employee}'
 */
destroy.url = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'employee_id' in args) {
            args = { employee: args.employee_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.employee_id
                : args.employee,
                }

    return destroy.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:333
 * @route '/employee/{employee}'
 */
destroy.delete = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:333
 * @route '/employee/{employee}'
 */
    const destroyForm = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:333
 * @route '/employee/{employee}'
 */
        destroyForm.delete = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const employee = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
destroy: Object.assign(destroy, destroy),
}

export default employee