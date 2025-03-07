<template>
  <div id="follows">
    <DynamicScroller :items="follows" :min-item-size="53" class="scroller" page-mode>
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[item.item]" :data-index="index" :watchData="true">
          <user
            :user="item"
            v-bind:key="item.id"
            :relationship="targetRelation(item.id)"
            @followAccount="followAccount"
            @unfollowAccount="unfollowAccount"
          >
          </user>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
    <div class="loading-card" v-loading="lazyLoading" :element-loading-background="backgroundColor"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, onMounted, watch, onUnmounted, toRefs } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18next } from 'vue3-i18next'
import { Entity } from 'megalodon'
import { useStore } from '@/store'
import User from '@/components/molecules/User.vue'
import { ACTION_TYPES } from '@/store/TimelineSpace/Contents/SideBar/AccountProfile/Follows'
import { ACTION_TYPES as PROFILE_ACTION, MUTATION_TYPES as PROFILE_MUTATION } from '@/store/TimelineSpace/Contents/SideBar/AccountProfile'

export default defineComponent({
  name: 'follows',
  props: {
    account: {
      type: Object as PropType<Entity.Account>,
      required: true
    }
  },
  components: { User },
  setup(props) {
    const space = 'TimelineSpace/Contents/SideBar/AccountProfile/Follows'
    const { account } = toRefs(props)
    const store = useStore()
    const i18n = useI18next()

    const follows = computed(() => store.state.TimelineSpace.Contents.SideBar.AccountProfile.Follows.follows)
    const relationships = computed(() => store.state.TimelineSpace.Contents.SideBar.AccountProfile.Follows.relationships)
    const lazyLoading = computed(() => store.state.TimelineSpace.Contents.SideBar.AccountProfile.Follows.lazyLoading)
    const backgroundColor = computed(() => store.state.App.theme.background_color)

    onMounted(() => {
      load()
      document.getElementById('sidebar_scrollable')?.addEventListener('scroll', onScroll)
    })
    watch(account, () => {
      load()
    })
    onUnmounted(() => {
      const el = document.getElementById('sidebar_scrollable')
      if (el !== undefined && el !== null) {
        el.removeEventListener('scroll', onScroll)
      }
    })

    const load = async () => {
      store.commit(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_MUTATION.CHANGE_LOADING}`, true)
      try {
        const follows = await store.dispatch(`${space}/${ACTION_TYPES.FETCH_FOLLOWS}`, account.value)
        await store.dispatch(`${space}/${ACTION_TYPES.FETCH_RELATIONSHIPS}`, follows)
      } catch (err) {
        console.error(err)
        ElMessage({
          message: i18n.t('message.follows_fetch_error'),
          type: 'error'
        })
      } finally {
        store.commit(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_MUTATION.CHANGE_LOADING}`, false)
      }
    }
    const onScroll = (event: Event) => {
      // for lazyLoading
      if (
        (event.target as HTMLElement)!.clientHeight + (event.target as HTMLElement)!.scrollTop >=
          document.getElementById('account_profile')!.clientHeight - 10 &&
        !lazyLoading.value
      ) {
        store.dispatch(`${space}/${ACTION_TYPES.LAZY_FETCH_FOLLOWS}`, account.value).catch(err => {
          console.error(err)
          ElMessage({
            message: i18n.t('message.timeline_fetch_error'),
            type: 'error'
          })
        })
      }
    }
    const targetRelation = (id: string) => {
      return relationships.value.find(r => r.id === id)
    }
    const followAccount = async (account: Entity.Account) => {
      store.commit(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_MUTATION.CHANGE_LOADING}`, true)
      try {
        await store.dispatch(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_ACTION.FOLLOW}`, account)
        await store.dispatch(`${space}/${ACTION_TYPES.FETCH_RELATIONSHIPS}`, follows.value)
      } catch (err) {
        ElMessage({
          message: i18n.t('message.follow_error'),
          type: 'error'
        })
      } finally {
        store.commit(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_MUTATION.CHANGE_LOADING}`, false)
      }
    }
    const unfollowAccount = async (account: Entity.Status) => {
      store.commit(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_MUTATION.CHANGE_LOADING}`, true)
      try {
        await store.dispatch(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_ACTION.UNFOLLOW}`, account)
        await store.dispatch(`${space}/${ACTION_TYPES.FETCH_RELATIONSHIPS}`, follows.value)
      } catch (err) {
        ElMessage({
          message: i18n.t('message.unfollow_error'),
          type: 'error'
        })
      } finally {
        store.commit(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_MUTATION.CHANGE_LOADING}`, false)
      }
    }

    return {
      follows,
      targetRelation,
      followAccount,
      unfollowAccount,
      lazyLoading,
      backgroundColor
    }
  }
})
</script>

<style lang="scss" scoped>
.loading-card {
  height: 60px;
}

.loading-card:empty {
  height: 0;
}
</style>
