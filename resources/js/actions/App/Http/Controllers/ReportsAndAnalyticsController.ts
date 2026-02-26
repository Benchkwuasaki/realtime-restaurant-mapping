import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReportsAndAnalyticsController::index
 * @see app/Http/Controllers/ReportsAndAnalyticsController.php:15
 * @route '/reports_and_analytics'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/reports_and_analytics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportsAndAnalyticsController::index
 * @see app/Http/Controllers/ReportsAndAnalyticsController.php:15
 * @route '/reports_and_analytics'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportsAndAnalyticsController::index
 * @see app/Http/Controllers/ReportsAndAnalyticsController.php:15
 * @route '/reports_and_analytics'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportsAndAnalyticsController::index
 * @see app/Http/Controllers/ReportsAndAnalyticsController.php:15
 * @route '/reports_and_analytics'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportsAndAnalyticsController::index
 * @see app/Http/Controllers/ReportsAndAnalyticsController.php:15
 * @route '/reports_and_analytics'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportsAndAnalyticsController::index
 * @see app/Http/Controllers/ReportsAndAnalyticsController.php:15
 * @route '/reports_and_analytics'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportsAndAnalyticsController::index
 * @see app/Http/Controllers/ReportsAndAnalyticsController.php:15
 * @route '/reports_and_analytics'
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
const ReportsAndAnalyticsController = { index }

export default ReportsAndAnalyticsController