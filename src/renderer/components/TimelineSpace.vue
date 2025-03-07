<template>
  <div
    id="timeline_space"
    v-loading="loading"
    :element-loading-text="$t('message.loading')"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(0, 0, 0, 0.8)"
  >
    <side-menu></side-menu>
    <div :class="collapse ? 'page-narrow' : 'page'">
      <header class="header" style="-webkit-app-region: drag">
        <header-menu></header-menu>
      </header>
      <contents></contents>
    </div>
    <modals></modals>
    <receive-drop v-show="droppableVisible"></receive-drop>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18next } from 'vue3-i18next'
import SideMenu from './TimelineSpace/SideMenu.vue'
import HeaderMenu from './TimelineSpace/HeaderMenu.vue'
import Contents from './TimelineSpace/Contents.vue'
import Modals from './TimelineSpace/Modals.vue'
import Mousetrap from 'mousetrap'
import ReceiveDrop from './TimelineSpace/ReceiveDrop.vue'
import { AccountLoadError } from '@/errors/load'
import { TimelineFetchError } from '@/errors/fetch'
import { NewTootAttachLength } from '@/errors/validations'
import { EventEmitter } from '@/components/event'
import { useStore } from '@/store'
import { ACTION_TYPES } from '@/store/TimelineSpace'
import { ACTION_TYPES as SIDEBAR_ACTION } from '@/store/TimelineSpace/Contents/SideBar'
import { MUTATION_TYPES as GLOBAL_HEADER_MUTATION } from '@/store/GlobalHeader'
import { MUTATION_TYPES as JUMP_MUTATION } from '@/store/TimelineSpace/Modals/Jump'
import { ACTION_TYPES as NEW_TOOT_ACTION } from '@/store/TimelineSpace/Modals/NewToot'

export default defineComponent({
  name: 'timeline-space',
  components: { SideMenu, HeaderMenu, Modals, Contents, ReceiveDrop },
  setup() {
    const space = 'TimelineSpace'
    const store = useStore()
    const route = useRoute()
    const i18n = useI18next()

    const dropTarget = ref<any>(null)
    const droppableVisible = ref<boolean>(false)

    const loading = computed(() => store.state.TimelineSpace.loading)
    const collapse = computed(() => store.state.TimelineSpace.SideMenu.collapse)
    // const modalOpened = computed(() => store.getters[`TimelineSpace/Modals/modalOpened`])
    // const shortcutEnabled = computed(() => !modalOpened.value)

    onMounted(async () => {
      store.dispatch(`TimelineSpace/Contents/SideBar/${SIDEBAR_ACTION.CLOSE}`)
      await initialize().finally(() => {
        store.commit(`GlobalHeader/${GLOBAL_HEADER_MUTATION.UPDATE_CHANGING}`, false)
      })
      ;(window as any).addEventListener('dragenter', onDragEnter)
      ;(window as any).addEventListener('dragleave', onDragLeave)
      ;(window as any).addEventListener('dragover', onDragOver)
      ;(window as any).addEventListener('drop', handleDrop)
      Mousetrap.bind(['command+t', 'ctrl+t'], () => {
        store.commit(`TimelineSpace/Modals/Jump/${JUMP_MUTATION.CHANGE_MODAL}`, true)
      })
    })
    onBeforeUnmount(() => {
      ;(window as any).removeEventListener('dragenter', onDragEnter)
      ;(window as any).removeEventListener('dragleave', onDragLeave)
      ;(window as any).removeEventListener('dragover', onDragOver)
      ;(window as any).removeEventListener('drop', handleDrop)
      store.dispatch(`${space}/${ACTION_TYPES.STOP_STREAMINGS}`)
      store.dispatch(`${space}/${ACTION_TYPES.UNBIND_STREAMINGS}`)
    })

    const clear = async () => {
      store.dispatch(`${space}/${ACTION_TYPES.UNBIND_STREAMINGS}`)
      await store.dispatch(`${space}/${ACTION_TYPES.CLEAR_ACCOUNT}`)
      store.dispatch(`${space}/${ACTION_TYPES.CLEAR_CONTENTS_TIMELINES}`)
      await store.dispatch(`${space}/${ACTION_TYPES.REMOVE_SHORTCUT_EVENTS}`)
      await store.dispatch(`${space}/${ACTION_TYPES.CLEAR_UNREAD}`)
      return 'clear'
    }
    const initialize = async () => {
      await clear()

      try {
        await store.dispatch(`${space}/${ACTION_TYPES.INIT_LOAD}`, route.params.id)
      } catch (err) {
        if (err instanceof AccountLoadError) {
          ElMessage({
            message: i18n.t('message.account_load_error'),
            type: 'error'
          })
        } else if (err instanceof TimelineFetchError) {
          ElMessage({
            message: i18n.t('message.timeline_fetch_error'),
            type: 'error'
          })
        }
      }

      await store.dispatch(`${space}/${ACTION_TYPES.PREPARE_SPACE}`)
    }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      droppableVisible.value = false
      if (e.dataTransfer?.files.item(0) === null || e.dataTransfer?.files.item(0) === undefined) {
        return false
      }
      const file = e.dataTransfer?.files.item(0)
      if (file === null || (!file.type.includes('image') && !file.type.includes('video'))) {
        ElMessage({
          message: i18n.t('validation.new_toot.attach_image'),
          type: 'error'
        })
        return false
      }
      store.dispatch(`TimelineSpace/Modals/NewToot/${NEW_TOOT_ACTION.OPEN_MODAL}`)
      store
        .dispatch(`TimelineSpace/Modals/NewToot/${NEW_TOOT_ACTION.UPLOAD_IMAGE}`, file)
        .then(() => {
          EventEmitter.emit('image-uploaded')
        })
        .catch(err => {
          if (err instanceof NewTootAttachLength) {
            ElMessage({
              message: i18n.t('validation.new_toot.attach_length', { max: 4 }),
              type: 'error'
            })
          } else {
            ElMessage({
              message: i18n.t('message.attach_error'),
              type: 'error'
            })
          }
        })
      return false
    }
    const onDragEnter = (e: DragEvent) => {
      if (e.dataTransfer && e.dataTransfer.types.indexOf('Files') >= 0) {
        dropTarget.value = e.target
        droppableVisible.value = true
      }
    }
    const onDragLeave = (e: DragEvent) => {
      if (e.target === dropTarget.value) {
        droppableVisible.value = false
      }
    }
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    return {
      loading,
      collapse,
      droppableVisible
    }
  }
})
</script>

<style lang="scss" scoped>
#timeline_space {
  height: 100%;
}

.page {
  margin-left: 180px;
  height: 100%;
  box-sizing: border-box;

  .header {
    width: calc(100% - 180px);
    position: fixed;
    top: 0;
    border-bottom: solid 1px var(--theme-border-color);
  }
}

.page-narrow {
  margin-left: 64px;
  height: 100%;
  box-sizing: border-box;

  .header {
    width: calc(100% - 64px);
    position: fixed;
    top: 0;
    height: 48px;
    border-bottom: solid 1px var(--theme-border-color);
  }
}

.with-global-header {
  .page .header {
    width: calc(100% - 245px);
  }

  .page-narrow .header {
    width: calc(100% - 65px - 64px);
  }
}
</style>
