<template>
  <div class="shortcut">
    <el-dialog :title="$t('modals.shortcut.title')" v-model="shortcutModal" width="500px" custom-class="shortcut-modal">
      <table class="shortcuts">
        <tbody>
          <tr>
            <td><kbd>Ctrl(Cmd) + 1, 2, 3...</kbd></td>
            <td>{{ $t('modals.shortcut.ctrl_number') }}</td>
          </tr>
          <tr>
            <td><kbd>Ctrl(Cmd) + k</kbd></td>
            <td>{{ $t('modals.shortcut.ctrl_k') }}</td>
          </tr>
          <tr>
            <td><kbd>Ctrl(Cmd) + n</kbd></td>
            <td>{{ $t('modals.shortcut.ctrl_n') }}</td>
          </tr>
          <tr>
            <td><kbd>Ctrl(Cmd) + Enter</kbd></td>
            <td>{{ $t('modals.shortcut.ctrl_enter') }}</td>
          </tr>
          <tr>
            <td><kbd>Ctrl(Cmd) + r</kbd></td>
            <td>{{ $t('modals.shortcut.ctrl_r') }}</td>
          </tr>
          <tr>
            <td><kbd>j</kbd></td>
            <td>{{ $t('modals.shortcut.j') }}</td>
          </tr>
          <tr>
            <td><kbd>k</kbd></td>
            <td>{{ $t('modals.shortcut.k') }}</td>
          </tr>
          <tr>
            <td><kbd>r</kbd></td>
            <td>{{ $t('modals.shortcut.r') }}</td>
          </tr>
          <tr>
            <td><kbd>b</kbd></td>
            <td>{{ $t('modals.shortcut.b') }}</td>
          </tr>
          <tr>
            <td><kbd>f</kbd></td>
            <td>{{ $t('modals.shortcut.f') }}</td>
          </tr>
          <tr>
            <td><kbd>o</kbd></td>
            <td>{{ $t('modals.shortcut.o') }}</td>
          </tr>
          <tr>
            <td><kbd>p</kbd></td>
            <td>{{ $t('modals.shortcut.p') }}</td>
          </tr>
          <tr>
            <td><kbd>i</kbd></td>
            <td>{{ $t('modals.shortcut.i') }}</td>
          </tr>
          <tr>
            <td><kbd>x</kbd></td>
            <td>{{ $t('modals.shortcut.x') }}</td>
          </tr>
          <tr>
            <td><kbd>?</kbd></td>
            <td>{{ $t('modals.shortcut.?') }}</td>
          </tr>
          <tr>
            <td><kbd>esc</kbd></td>
            <td>{{ $t('modals.shortcut.esc') }}</td>
          </tr>
        </tbody>
      </table>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useStore } from '@/store'
import { MUTATION_TYPES } from '@/store/TimelineSpace/Modals/Shortcut'

export default defineComponent({
  name: 'shortcut',
  setup() {
    const space = 'TimelineSpace/Modals/Shortcut'
    const store = useStore()
    const shortcutModal = computed({
      get: () => store.state.TimelineSpace.Modals.Shortcut.modalOpen,
      set: (value: boolean) => store.commit(`${space}/${MUTATION_TYPES.CHANGE_MODAL}`, value)
    })

    return {
      shortcutModal
    }
  }
})
</script>

<style lang="scss" scoped>
.shortcut :deep() {
  .el-dialog__header {
    background-color: #4a5664;
    margin-right: 0;

    .el-dialog__title {
      color: #ebeef5;
    }
  }
}

.shortcut {
  .shortcuts {
    text-align: left;
    border-collapse: collapse;
    line-height: 28px;
    width: 100%;

    tr {
      border: none;

      &:nth-child(even) {
        background-color: #fafafa;
      }

      &:hover {
        background-color: #f2f6fc;
      }

      td {
        padding: 4px 8px;
      }
    }

    kbd {
      display: inline-block;
      padding: 3px 5px;
      font-size: 11px;
      line-height: 10px;
      color: #444d56;
      vertical-align: middle;
      background-color: #fafbfc;
      border: solid 1px #c6cbd1;
      border-bottom-color: #959da5;
      border-radius: 3px;
      box-shadow: inset 0 -1px 0 #959da5;
    }
  }
}
</style>
