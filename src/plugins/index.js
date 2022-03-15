import Vue from 'vue'
import VueBus from 'vue-bus'
import * as signalR from '@aspnet/signalr'
import { OrderStatus } from '@/common'
import dayjs from 'dayjs'
import numeral from 'numeral'
import { merge } from 'lodash'

Vue.use(VueBus)

export const GUID = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

Vue.prototype.$qs = function(qs) {
	this.$router.replace({
		query: merge({}, this.$route.query, qs)
	})
	
}

Vue.prototype.$formatSize = size => numeral(size / 1000 / 1000).format('0.[00]') + 'MB'

Vue.prototype.$OrderStatus = OrderStatus

Vue.prototype.$modal = props => Vue.prototype.$bus.$emit('modal', props)

Vue.prototype.$signalR = signalR;

Vue.prototype.$GUID = GUID

Vue.prototype.$lang = {
	emptyText: 'Нет данных',
	locale: {
		lang: {
		  "placeholder": "Select date",
		  "rangePlaceholder": ["Start date", "End date"],
		  "today": "Сегодня",
		  "now": "Сейчас",
		  "backToToday": "Back to today",
		  "ok": "Ок",
		  "clear": "Очистить",
		  "month": "Месяц",
		  "year": "Год",
		  "timeSelect": "Выбрать время",
		  "dateSelect": "Выбрать дату",
		  "monthSelect": "Выбрать месяц",
		  "yearSelect": "Выбрать год",
		  "decadeSelect": "Выбрать декаду",
		  "yearFormat": "YYYY",
		  "dateFormat": "M/D/YYYY",
		  "dayFormat": "D",
		  "dateTimeFormat": "M/D/YYYY HH:mm:ss",
		  "monthFormat": "MMMM",
		  "monthBeforeYear": true,
		  "previousMonth": "Previous month (PageUp)",
		  "nextMonth": "Next month (PageDown)",
		  "previousYear": "Last year (Control + left)",
		  "nextYear": "Next year (Control + right)",
		  "previousDecade": "Last decade",
		  "nextDecade": "Next decade",
		  "previousCentury": "Last century",
		  "nextCentury": "Next century"
		},
		"timePickerLocale": {
		  "placeholder": "Select time"
		},
		"dateFormat": "DD.MM.YYYY",
		"dateTimeFormat": "DD.MM.YYYY HH:mm:ss",
		"weekFormat": "YYYY-wo",
		"monthFormat": "YYYY-MM"
	  }
}

Vue.prototype.$date = {
	full: date => dayjs(date).format('DD.MM.YYYY HH:mm'),
	short: date => dayjs(date).format('DD.MM.YYYY'),
}

Vue.prototype.$fileToFormData = file => {
	const fd = new FormData()
	fd.append('file', file)

	return fd
}