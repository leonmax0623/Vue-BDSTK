import { HOST as baseURL } from '../index';

export default ({ post }) => ({
    token(credentials) {
        return post('/token', credentials, { baseURL })
    }
})