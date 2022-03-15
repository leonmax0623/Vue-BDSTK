<template>
	
	<div class="auth">
		<a-card hoverable style="width: 400px" title="Авторизация">
			<!-- <a class="auth-forgot" href="#" slot="extra">
					Восстановить доступ
				</a> -->
			<!-- <img
				alt="example"
				src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
				slot="cover"
			/> -->

			<a-form layout="horizontal" @submit="handleSubmit">
				<a-form-item >
					<a-input
						v-model="credentials.username"
						placeholder="Имя пользователя"
						
					>
						<a-icon slot="prefix" type="user" style="color:rgba(0,0,0,.25)" />
					</a-input>
				</a-form-item>
				<a-form-item>
					<a-input-password
						v-model="credentials.password"
						placeholder="Пароль"
					>
						<a-icon slot="prefix" type="lock" style="color:rgba(0,0,0,.25)" />
					</a-input-password>
				</a-form-item>

				<a-form-item>
					<a-checkbox
						v-model="remember"
					>
						Запомнить пароль
					</a-checkbox>
	
					
					<a-button block :loading="loading" html-type="submit" :disabled="disabled">
						Войти
					</a-button>
				</a-form-item>
			</a-form>
		</a-card>
	</div>
</template>

<script>
import { isPROD } from '@/utils'
import { mapActions, mapState } from 'vuex'
import _ from 'lodash'
import { AccessMap } from '@/router'

export default {
	data() {
		return {
			loading: false,
			remember: true,
			credentials: {
				username: isPROD ? '' : 'head1',
				password: isPROD ? '' : 'head1'
			}
		}
	},
	computed: {
		// ...mapState('app', ['access']),
		disabled() {
			return !(
				this.credentials.username && this.credentials.password
			)
		}
	},
	methods: {
		...mapActions('auth', ['login']),
		...mapActions('app', ['loadAccess']),
		async handleSubmit(e) {
			e.preventDefault()


			this.loading = true

			try {
				await this.login(this.credentials)

				this.$notification.success({
						message: 'Вход выполнен',
				})

				const access = await this.loadAccess()

				const route = access.find(item => item.access)
				const requestRoute = access.find(item => item.name === 'Requests')

				if(route) {
					if(requestRoute) {
						this.$router.push({ name: 'Requests' })
					} else {
						this.$router.push({ name: AccessMap[route.name] })
					}
				} else {
					this.$notification.success({
							message: 'Отсутсвует доступ к приложению',
					})
				}
			} catch(e) {
				const { status, message } = e
				
				if(message === 'Network Error') {
					this.$notification.error({
						message: 'Ошибка Сертификата',
						description: 'Добавьте сертификат в доверенные',
					})

					return
				}

				if(_.isEqual(status, 400)) {
					this.credentials.username = ''
					this.credentials.password = ''

					this.$notification.error({
						message: 'Ошибка авторизации',
						description: 'Неверное имя пользователя или пароль',
					});
				}
			} finally {
				this.loading = false
			}

			return false
		}
	}
}
</script>

<style lang="scss" scoped>
	.auth {
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	
		&:before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: url(~@/assets/img/auth_bg.jpg) no-repeat center;
			background-size: cover;
			opacity: .4;
			filter: blur(4px);
		}

		background: #000;

		&-form {

		}

		&-forgot {
			float: right;
		}

		.ant-form-item:last-child {
			margin-bottom: 0;
		}
	}
</style>