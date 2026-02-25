import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\BenefitsController::index
 * @see app/Http/Controllers/BenefitsController.php:15
 * @route '/benefits'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/benefits',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BenefitsController::index
 * @see app/Http/Controllers/BenefitsController.php:15
 * @route '/benefits'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BenefitsController::index
 * @see app/Http/Controllers/BenefitsController.php:15
 * @route '/benefits'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\BenefitsController::index
 * @see app/Http/Controllers/BenefitsController.php:15
 * @route '/benefits'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\BenefitsController::index
 * @see app/Http/Controllers/BenefitsController.php:15
 * @route '/benefits'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\BenefitsController::index
 * @see app/Http/Controllers/BenefitsController.php:15
 * @route '/benefits'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\BenefitsController::index
 * @see app/Http/Controllers/BenefitsController.php:15
 * @route '/benefits'
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
const benefits = {
    index: Object.assign(index, index),
}

export default benefits