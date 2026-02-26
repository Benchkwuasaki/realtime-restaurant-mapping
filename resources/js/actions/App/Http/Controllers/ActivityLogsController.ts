import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ActivityLogsController::index
 * @see app/Http/Controllers/ActivityLogsController.php:14
 * @route '/activity_logs'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/activity_logs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ActivityLogsController::index
 * @see app/Http/Controllers/ActivityLogsController.php:14
 * @route '/activity_logs'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActivityLogsController::index
 * @see app/Http/Controllers/ActivityLogsController.php:14
 * @route '/activity_logs'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ActivityLogsController::index
 * @see app/Http/Controllers/ActivityLogsController.php:14
 * @route '/activity_logs'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ActivityLogsController::index
 * @see app/Http/Controllers/ActivityLogsController.php:14
 * @route '/activity_logs'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ActivityLogsController::index
 * @see app/Http/Controllers/ActivityLogsController.php:14
 * @route '/activity_logs'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ActivityLogsController::index
 * @see app/Http/Controllers/ActivityLogsController.php:14
 * @route '/activity_logs'
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
const ActivityLogsController = { index }

export default ActivityLogsController