<template>
  <Page>
    <SubHeader slot="sub-header" :title="'Заявка #' + (request ? request.number : '')">
      <div class="actions" v-if="request">
        <a-button
          type="link"
          html-type="button"
          class="mr"
          @click="$router.push('/requests')"
          icon="left"
          size="large"
        >К списку заявок</a-button>
        
        <a-button type="primary" html-type="button" size="large" @click="$router.push('/requests/new/' + request.id)">Заменить</a-button>
        <a-button type="primary" html-type="button" size="large" v-if="withOrder" @click="$router.push('/orders/' + request.orderID)">Открыть заказ</a-button>

        <a-popconfirm placement="left" okText="Создать" cancelText="Отмена" @confirm="createOrder" v-if="!withOrder && allowEdit('Requests')">
          <template slot="title">
            <span>Создать заказ на основе заявки?</span>
          </template>
          <a-button type="primary" html-type="button" size="large">Создать заказ</a-button>
        </a-popconfirm>
      </div>
    </SubHeader>

    <a-card :loading="!request">
      <RequestForm ref="RequestForm" :readonly="readonly" @submit="handleSubmit">
        <a-col slot="footer" :offset="3">
          <template v-if="readonly">
            <a-button
              v-if="!withOrder"
              type="outline"
              html-type="button"
              class="mr"
              @click="toggleReadonly(false, $event)"
            >Редактировать</a-button>
            
          </template>

          <template v-else>
            <a-button type="outline" html-type="button" class="mr" @click="reset">Отмена</a-button>

            <a-button
              type="outline"
              html-type="submit"
              class="mr"
              @click="handleSubmit"
            >Сохранить изменения</a-button>
          </template>
        </a-col>
      </RequestForm>
    </a-card>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'
import { PaymentType, AddressType, PersonType } from '@/common'

export default {
  data() {
    return {
      readonly: true,
      request: null
    };
  },
  created() {
    this.fetch();
  },
  methods: {
    createOrder() {
      this.$api.order.createOrderFromRequest(this.id)
        .then(() => {
          this.$notification.success({
            message: 'Новый заказ оформлен'
          })
  
          this.fetch()
        })
    },
    init() {
      setTimeout(() => {
        this.$refs.RequestForm.form.setFieldsValue({
          projectNumber: this.request.projectNumber,
          abonent: this.request.abonent.id,
          regionType: this.request.regionType.id,
          channelAddress: this.request.addresses.find(x => x.typeID === AddressType.Channel).address1,
          balancerType: this.request.balancerType.id,
          serviceType: this.request.serviceType.id,
          clientName: this.request.client.name,
          clientPersonName: this.request.clientPersons.find(x => x.typeID === PersonType.Client).firstName,
          clientPersonPhone: this.request.clientPersons.find(x => x.typeID === PersonType.Client).phone,
          deliveryAddress: this.request.addresses.find(x => x.typeID === AddressType.Delivery).address1,
          deliveryPerson: this.request.clientPersons.find(x => x.typeID === PersonType.Delivery).firstName,
          onceFee: this.request.fees.find(x => x.typeID === PaymentType.SinglePayment).value,
          periodicFee: this.request.fees.find(x => x.typeID === PaymentType.PeriodicPayment).value,
          transferChannel: this.request.transferChannel,
          comments: this.request.comments
        })
      })
    },
    toggleReadonly(value, e) {
      e.preventDefault();
      this.readonly = value;
    },
    async fetch() {
      const { id } = this.$route.params;

      try {
        this.request = await this.$api.request.getRequestById(id);

        this.$nextTick(this.init);
      } catch (e) {
        this.$message.error("Произошла ошибка");
      }
    },
    reset(e) {
      this.toggleReadonly(true, e);
      this.$refs.RequestForm.form.resetFields();
      this.init()
    },
    handleSubmit(e) {
      e.preventDefault();

      this.$refs.RequestForm.form.validateFieldsAndScroll((err, form) => {
        if (err) {
          return;
        }

        const data = {
            abonent: _.find(this.$refs.RequestForm.abonents, x => x.id === form.abonent),
            addresses: [
                {
                    typeID: AddressType.Channel,
                    address1: form.channelAddress,
                },
                {
                    typeID: AddressType.Delivery,
                    address1: form.deliveryAddress,
                },
            ],
            projectNumber: String(form.projectNumber),
            balancerType: _.find(this.$refs.RequestForm.bns, x => x.id === form.balancerType),
            serviceType: _.find(this.$refs.RequestForm.services, x => x.id === form.serviceType),
            regionType: _.find(this.$refs.RequestForm.regions, x => x.id === form.regionType),
            fees: [
                {
                    typeID: PaymentType.PeriodicPayment,
                    value: +form.periodicFee
                },
                {
                    typeID: PaymentType.SinglePayment,
                    value: +form.onceFee
                },
            ],
            client: {
                name: form.clientName
            },
            clientPersons: [
                {
                    typeID: PersonType.Client,
                    phone: form.clientPersonPhone,
                    firstName: form.clientPersonName
                },
                {
                    typeID: PersonType.Delivery,
                    firstName: form.deliveryPerson
                },
            ],
            transferChannel: String(form.transferChannel),
            comments: String(form.comments)
        }

        this.loading = true
        this.$api.request.updateRequest(this.id, data)
            .then(() => {
              this.$notification.success({
                message: 'Изменения сохранены'
              })
              this.readonly = true
            })
            .catch(() => {

            })
            .then(() => {
                this.loading = false
            })
      });
    }
  },
  computed: {
    ...mapGetters('app', ['allowEdit']),
    id() {
      return this.$route.params.id;
    },
    formRef() {
      return this.$refs.RequestForm;
    },
    withOrder() {
      return this.request && this.request.orderID
    }
  }
};
</script>

