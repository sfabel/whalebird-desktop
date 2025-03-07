<template>
  <nav id="header_menu" :aria-label="title">
    <div class="channel">
      <h1>{{ title }}</h1>
    </div>
    <div class="tools">
      <img src="../../assets/images/loading-spinner-wide.svg" v-show="loading" class="header-loading" />
      <el-button class="action" link :title="$t('header_menu.new_toot')" @click="openNewTootModal">
        <font-awesome-icon :icon="['far', 'pen-to-square']" />
      </el-button>
      <el-button v-show="reloadable()" link class="action" :title="$t('header_menu.reload')" @click="reload">
        <font-awesome-icon icon="rotate" />
      </el-button>
      <el-popover v-if="TLOption()" placement="left-start" width="180" popper-class="theme-popover" trigger="click">
        <div>
          <el-form role="form" label-position="left" label-width="125px" size="default">
            <el-form-item for="show-reblogs" :label="$t('header_menu.option.show_reblogs')">
              <el-checkbox id="show-reblogs" :model-value="showReblogs"></el-checkbox>
            </el-form-item>
            <el-form-item for="show-replies" :label="$t('header_menu.option.show_replies')">
              <el-checkbox id="show-replies" :model-value="showReplies"></el-checkbox>
            </el-form-item>
            <el-button type="primary" @click="applyTLOption">{{ $t('header_menu.option.apply') }}</el-button>
          </el-form>
        </div>
        <template #reference>
          <el-button link class="action" :title="$t('header_menu.option.title')">
            <font-awesome-icon icon="sliders" />
          </el-button>
        </template>
      </el-popover>
      <el-button class="action" link :title="$t('header_menu.settings')" @click="settings">
        <font-awesome-icon icon="gear" />
      </el-button>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18next } from 'vue3-i18next'
import { useStore } from '@/store'
import { ACTION_TYPES, MUTATION_TYPES } from '@/store/TimelineSpace/HeaderMenu'
import { ACTION_TYPES as NEW_TOOT_ACTION } from '@/store/TimelineSpace/Modals/NewToot'
import { MUTATION_TYPES as HOME_MUTATION } from '@/store/TimelineSpace/Contents/Home'

export default defineComponent({
  name: 'header-menu',
  setup() {
    const space = 'TimelineSpace/HeaderMenu'
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const i18n = useI18next()

    const showReblogs = ref<boolean>(true)
    const showReplies = ref<boolean>(true)

    const title = computed(() => store.state.TimelineSpace.HeaderMenu.title)
    const loading = computed(() => store.state.TimelineSpace.HeaderMenu.loading)
    const id = computed(() => route.params.id)

    onMounted(() => {
      channelName()
      loadTLOption()
      store.dispatch(`${space}/${ACTION_TYPES.SETUP_LOADING}`)
    })
    watch(
      () => route.name,
      () => {
        channelName()
        loadTLOption()
      }
    )
    const channelName = () => {
      switch (route.name) {
        case 'home':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.home'))
          break
        case 'notifications':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.notification'))
          break
        case 'favourites':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.favourite'))
          break
        case 'bookmarks':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.bookmark'))
          break
        case 'mentions':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.mention'))
          break
        case 'follow-requests':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.follow_requests'))
          break
        case 'local':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.local'))
          break
        case 'public':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.public'))
          break
        case 'hashtag-list':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.hashtag'))
          break
        case 'tag':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, `#${route.params.tag}`)
          break
        case 'search':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.search'))
          break
        case 'lists':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.lists'))
          break
        case 'direct-messages':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.direct_messages'))
          break
        case 'edit-list':
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.members'))
          break
        case 'list':
          store.dispatch(`${space}/${ACTION_TYPES.FETCH_LIST}`, route.params.list_id)
          break
        default:
          console.debug(route)
          store.commit(`${space}/${MUTATION_TYPES.UPDATE_TITLE}`, i18n.t('header_menu.home'))
          break
      }
    }
    const openNewTootModal = () => {
      store.dispatch(`TimelineSpace/Modals/NewToot/${NEW_TOOT_ACTION.OPEN_MODAL}`)
    }
    const reload = () => {
      switch (route.name) {
        case 'home':
        case 'notifications':
        case 'mentions':
        case 'favourites':
        case 'bookmarks':
        case 'local':
        case 'public':
        case 'tag':
        case 'list':
        case 'direct-messages':
          store.commit(`${space}/${MUTATION_TYPES.CHANGE_RELOAD}`, true)
          break
        default:
          console.error('Not implemented: ', route.name)
      }
    }
    const reloadable = () => {
      switch (route.name) {
        case 'home':
        case 'notifications':
        case 'mentions':
        case 'favourites':
        case 'bookmarks':
        case 'local':
        case 'public':
        case 'tag':
        case 'list':
        case 'direct-messages':
          return true
        default:
          return false
      }
    }
    const loadTLOption = () => {
      switch (route.name) {
        case 'home':
          showReblogs.value = store.state.TimelineSpace.Contents.Home.showReblogs
          showReplies.value = store.state.TimelineSpace.Contents.Home.showReplies
          break
        default:
          break
      }
    }
    const applyTLOption = () => {
      switch (route.name) {
        case 'home':
          store.commit(`TimelineSpace/Contents/Home/${HOME_MUTATION.SHOW_REBLOGS}`, showReblogs.value)
          store.commit(`TimelineSpace/Contents/Home/${HOME_MUTATION.SHOW_REPLIES}`, showReplies.value)
          break
        default:
          break
      }
    }
    const TLOption = () => {
      switch (route.name) {
        case 'home':
          return true
        default:
          return false
      }
    }
    const settings = () => {
      const url = `/${id.value}/settings`
      router.push(url)
    }

    return {
      title,
      loading,
      openNewTootModal,
      reloadable,
      reload,
      TLOption,
      showReblogs,
      showReplies,
      applyTLOption,
      settings
    }
  }
})
</script>

<style lang="scss" scoped>
#header_menu {
  background-color: var(--theme-background-color);
  padding: 10px 20px;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  user-select: none;
  line-height: normal;

  .channel {
    margin-right: auto;

    h1 {
      margin: 0;
      line-height: 32px;
    }
  }

  .tools {
    display: flex;
    justify-content: flex-end;
    align-items: center;

    .header-loading {
      width: 18px;
    }

    .action {
      color: var(--theme-secondary-color);
      padding: 0;
      margin-left: 8px;

      &:hover {
        color: #409eff;
      }
    }
  }
}

.input-wrapper {
  position: relative;
  font-size: 14px;
  display: inline-block;
  max-width: 100%;

  input {
    background-color: #fff;
    background-image: none;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    box-sizing: border-box;
    color: #606266;
    display: inline-block;
    font-size: inherit;
    height: 40px;
    line-height: 40px;
    outline: none;
    padding: 0 15px;
    transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
    width: 100%;

    &:focus {
      outline: none;
      border-color: #409eff;
    }
  }
}
</style>
