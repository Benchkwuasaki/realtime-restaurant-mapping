import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\DocumentTrackingController::index
 * @see app/Http/Controllers/DocumentTrackingController.php:15
 * @route '/document_tracking'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/document_tracking',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DocumentTrackingController::index
 * @see app/Http/Controllers/DocumentTrackingController.php:15
 * @route '/document_tracking'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DocumentTrackingController::index
 * @see app/Http/Controllers/DocumentTrackingController.php:15
 * @route '/document_tracking'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\DocumentTrackingController::index
 * @see app/Http/Controllers/DocumentTrackingController.php:15
 * @route '/document_tracking'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\DocumentTrackingController::index
 * @see app/Http/Controllers/DocumentTrackingController.php:15
 * @route '/document_tracking'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\DocumentTrackingController::index
 * @see app/Http/Controllers/DocumentTrackingController.php:15
 * @route '/document_tracking'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\DocumentTrackingController::index
 * @see app/Http/Controllers/DocumentTrackingController.php:15
 * @route '/document_tracking'
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
const DocumentTrackingController = { index }

export default DocumentTrackingController