export const isPROD = process.env.NODE_ENV === 'production'
import { castArray } from 'lodash'

export const filterByFields = (searchQuery, array) => fields => {
    const queryArray = castArray(searchQuery)

    if(!queryArray.some(Boolean)) {
        return array
    }

    if(!array) {
        return []
    }

    return array.filter(item => {
        return fields.some(key => {
            const value = _.isFunction(key)
                ? key(item)
                : String(_.get(item, key))

            if(!value) {
                return false
            }

            return searchQuery.some(item => value.toLowerCase().includes(item.toLowerCase()))
        })
    })
}