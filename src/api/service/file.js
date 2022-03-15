export default ({ get, delete: _delete, put, post }) => ({
	uploadFile(formData) {
		return post(`/File`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
	},
	getFile(fileId) {
		return get(`/File/${fileId}`, {
			responseType: 'arraybuffer',
		})
	},
	getFileMeta(fileId) {
		return get(`/File/${fileId}/metadata`)
	},
	getFileMetaArray(ids) {
		return post(`/File/metadata`, ids)
	}
})