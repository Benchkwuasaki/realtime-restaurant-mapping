import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:379
 * @route '/employee/{employee}/eligibility'
 */
export const store = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/employee/{employee}/eligibility',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:379
 * @route '/employee/{employee}/eligibility'
 */
store.url = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:379
 * @route '/employee/{employee}/eligibility'
 */
store.post = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:379
 * @route '/employee/{employee}/eligibility'
 */
    const storeForm = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:379
 * @route '/employee/{employee}/eligibility'
 */
        storeForm.post = (args: { employee: number | { employee_id: number } } | [employee: number | { employee_id: number } ] | number | { employee_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:395
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
export const update = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/employee/{employee}/eligibility/{eligibility}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:395
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
update.url = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                    eligibility: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.employee_id
                : args.employee,
                                eligibility: typeof args.eligibility === 'object'
                ? args.eligibility.eligibility_information_id
                : args.eligibility,
                }

    return update.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace('{eligibility}', parsedArgs.eligibility.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:395
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
update.put = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:395
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
    const updateForm = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
 * @see app/Http/Controllers/EmployeeController.php:395
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
        updateForm.put = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:412
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
export const destroy = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/employee/{employee}/eligibility/{eligibility}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:412
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
destroy.url = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                    eligibility: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.employee_id
                : args.employee,
                                eligibility: typeof args.eligibility === 'object'
                ? args.eligibility.eligibility_information_id
                : args.eligibility,
                }

    return destroy.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace('{eligibility}', parsedArgs.eligibility.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:412
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
destroy.delete = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:412
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
    const destroyForm = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
 * @see app/Http/Controllers/EmployeeController.php:412
 * @route '/employee/{employee}/eligibility/{eligibility}'
 */
        destroyForm.delete = (args: { employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } } | [employee: number | { employee_id: number }, eligibility: number | { eligibility_information_id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const eligibility = {
    store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default eligibility