<template>
  <div ref="notificationRef" class="relationship" tabIndex="0" role="article" aria-label="follow event" @click="$emit('select')">
    <div class="follow">
      <div class="action">
        <div class="action-mark">
          <font-awesome-icon icon="user-plus" size="sm" />
        </div>
        <div class="action-detail">
          <span class="bold" @click="openUser(message.account)">
            <bdi
              v-html="
                $t('notification.follow.body', {
                  username: username(message.account),
                  interpolation: { escapeValue: false }
                })
              "
            ></bdi>
          </span>
        </div>
        <div class="action-icon" role="presentation">
          <FailoverImg :src="message.account.avatar" />
        </div>
      </div>
      <div class="clearfix"></div>
    </div>
    <div class="fill-line"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRefs, ref, nextTick, watch } from 'vue'
import { Entity } from 'megalodon'
import { useStore } from '@/store'
import FailoverImg from '@/components/atoms/FailoverImg.vue'
import { usernameWithStyle } from '@/utils/username'
import { ACTION_TYPES as SIDEBAR_ACTION, MUTATION_TYPES as SIDEBAR_MUTATION } from '@/store/TimelineSpace/Contents/SideBar'
import { ACTION_TYPES as PROFILE_ACTION } from '@/store/TimelineSpace/Contents/SideBar/AccountProfile'

export default defineComponent({
  name: 'follow',
  components: {
    FailoverImg
  },
  props: {
    message: {
      type: Object as PropType<Entity.Notification>,
      default: {}
    },
    focused: {
      type: Boolean,
      default: false
    },
    overlaid: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select'],
  setup(props) {
    const { focused } = toRefs(props)
    const store = useStore()
    const notificationRef = ref<any>(null)

    // const shortcutEnabled = computed(() => focused.value && !overlaid.value)
    const displayNameStyle = computed(() => store.state.App.displayNameStyle)

    watch(focused, (newVal, oldVal) => {
      if (newVal) {
        nextTick(() => {
          notificationRef.value.focus()
        })
      } else if (oldVal && !newVal) {
        nextTick(() => {
          notificationRef.value.blur()
        })
      }
    })

    const username = (account: Entity.Account) => usernameWithStyle(account, displayNameStyle.value)
    const openUser = (account: Entity.Account) => {
      store.dispatch(`TimelineSpace/Contents/SideBar/${SIDEBAR_ACTION.OPEN_ACCOUNT_COMPONENT}`)
      store.dispatch(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_ACTION.CHANGE_ACCOUNT}`, account)
      store.commit(`TimelineSpace/Contents/SideBar/${SIDEBAR_MUTATION.CHANGE_OPEN_SIDEBAR}`, true)
    }

    return {
      notificationRef,
      username,
      openUser
    }
  }
})
</script>

<style lang="scss" scoped>
.bold {
  font-weight: bold;
}

.follow {
  padding: 8px 0 0 16px;

  .action {
    margin-right: 8px;

    .action-mark {
      color: #409eff;
      float: left;
      text-align: right;
      width: 32px;
    }

    .action-detail {
      margin-left: 10px;
      font-size: var(--base-font-size);
      float: left;
      max-width: 80%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      .bold {
        cursor: pointer;
      }

      .bold :deep(.emojione) {
        max-width: 14px;
        max-height: 14px;
      }
    }

    .action-icon {
      width: 100%;
      text-align: right;

      img {
        width: 16px;
        height: 16px;
        border-radius: 2px;
      }
    }
  }
}

.relationship:focus {
  background-color: var(--theme-selected-background-color);
  outline: 0;
}

.fill-line {
  height: 1px;
  background-color: var(--theme-border-color);
  margin: 4px 0 0;
}
</style>
