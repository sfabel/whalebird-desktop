import { Response, Entity } from 'megalodon'
import { createStore, Store } from 'vuex'
import Favourites, { FavouritesState } from '@/store/TimelineSpace/Contents/Favourites'
import { LocalAccount } from '~/src/types/localAccount'
import { RootState } from '@/store'

const mockClient = {
  getFavourites: () => {
    return new Promise<Response<Array<Entity.Status>>>(resolve => {
      const res: Response<Array<Entity.Status>> = {
        data: [status1],
        status: 200,
        statusText: 'OK',
        headers: {}
      }
      resolve(res)
    })
  }
}

jest.mock('megalodon', () => ({
  ...jest.requireActual<object>('megalodon'),
  default: jest.fn(() => mockClient),
  __esModule: true
}))

const localAccount: LocalAccount = {
  _id: '1',
  baseURL: 'http://localhost',
  domain: 'localhost',
  clientId: 'id',
  clientSecret: 'secret',
  accessToken: 'token',
  refreshToken: null,
  username: 'hoge',
  accountId: '1',
  avatar: null,
  order: 1
}

const account: Entity.Account = {
  id: '1',
  username: 'h3poteto',
  acct: 'h3poteto@pleroma.io',
  display_name: 'h3poteto',
  locked: false,
  created_at: '2019-03-26T21:30:32',
  followers_count: 10,
  following_count: 10,
  statuses_count: 100,
  note: 'engineer',
  url: 'https://pleroma.io',
  avatar: '',
  avatar_static: '',
  header: '',
  header_static: '',
  emojis: [],
  moved: null,
  fields: null,
  bot: false
}
const status1: Entity.Status = {
  id: '1',
  uri: 'http://example.com',
  url: 'http://example.com',
  account: account,
  in_reply_to_id: null,
  in_reply_to_account_id: null,
  reblog: null,
  content: 'hoge',
  plain_content: 'hoge',
  created_at: '2019-03-26T21:40:32',
  emojis: [],
  replies_count: 0,
  reblogs_count: 0,
  favourites_count: 0,
  reblogged: null,
  favourited: null,
  muted: null,
  sensitive: false,
  spoiler_text: '',
  visibility: 'public',
  media_attachments: [],
  mentions: [],
  tags: [],
  card: null,
  poll: null,
  application: {
    name: 'Web'
  } as Entity.Application,
  language: null,
  pinned: null,
  emoji_reactions: [],
  bookmarked: false,
  quote: false
}
const status2: Entity.Status = {
  id: '2',
  uri: 'http://example.com',
  url: 'http://example.com',
  account: account,
  in_reply_to_id: null,
  in_reply_to_account_id: null,
  reblog: null,
  content: 'fuga',
  plain_content: 'fuga',
  created_at: '2019-03-26T21:40:32',
  emojis: [],
  replies_count: 0,
  reblogs_count: 0,
  favourites_count: 0,
  reblogged: null,
  favourited: null,
  muted: null,
  sensitive: false,
  spoiler_text: '',
  visibility: 'public',
  media_attachments: [],
  mentions: [],
  tags: [],
  card: null,
  poll: null,
  application: {
    name: 'Web'
  } as Entity.Application,
  language: null,
  pinned: null,
  emoji_reactions: [],
  bookmarked: false,
  quote: false
}

let state = (): FavouritesState => {
  return {
    favourites: [],
    lazyLoading: false,
    maxId: null
  }
}

const initStore = () => {
  return {
    namespaced: true,
    state: state(),
    actions: Favourites.actions,
    mutations: Favourites.mutations
  }
}

const contentsStore = () => ({
  namespaced: true,
  modules: {
    Favourites: initStore()
  }
})

const timelineStore = () => ({
  namespaced: true,
  state: {
    account: {
      accessToken: 'token',
      baseURL: 'http://localhost'
    },
    sns: 'mastodon'
  },
  modules: {
    Contents: contentsStore()
  }
})

const appState = {
  namespaced: true,
  state: {
    proxyConfiguration: false
  }
}

describe('Favourites', () => {
  let store: Store<RootState>

  beforeEach(() => {
    store = createStore({
      modules: {
        TimelineSpace: timelineStore(),
        App: appState
      }
    })
  })

  describe('fetchFavourites', () => {
    it('does not exist header', async () => {
      await store.dispatch('TimelineSpace/Contents/Favourites/fetchFavourites', localAccount)
      expect(store.state.TimelineSpace.Contents.Favourites.favourites).toEqual([status1])
      expect(store.state.TimelineSpace.Contents.Favourites.maxId).toEqual(null)
    })

    it('link is null', async () => {
      mockClient.getFavourites = () => {
        return new Promise<Response<Array<Entity.Status>>>(resolve => {
          const res: Response<Array<Entity.Status>> = {
            data: [status1],
            status: 200,
            statusText: 'OK',
            headers: {
              link: null
            }
          }
          resolve(res)
        })
      }
      await store.dispatch('TimelineSpace/Contents/Favourites/fetchFavourites', localAccount)
      expect(store.state.TimelineSpace.Contents.Favourites.favourites).toEqual([status1])
      expect(store.state.TimelineSpace.Contents.Favourites.maxId).toEqual(null)
    })

    it('link exists in header', async () => {
      mockClient.getFavourites = () => {
        return new Promise<Response<Array<Entity.Status>>>(resolve => {
          const res: Response<Array<Entity.Status>> = {
            data: [status1],
            status: 200,
            statusText: 'OK',
            headers: {
              link: '<http://localhost?max_id=2>; rel="next"'
            }
          }
          resolve(res)
        })
      }

      await store.dispatch('TimelineSpace/Contents/Favourites/fetchFavourites', localAccount)
      expect(store.state.TimelineSpace.Contents.Favourites.favourites).toEqual([status1])
      expect(store.state.TimelineSpace.Contents.Favourites.maxId).toEqual('2')
    })
  })

  describe('lazyFetchFavourites', () => {
    describe('lazyLoading', () => {
      beforeAll(() => {
        state = () => {
          return {
            favourites: [],
            lazyLoading: true,
            maxId: null
          }
        }
      })
      it('should not be updated', async () => {
        const res = await store.dispatch('TimelineSpace/Contents/Favourites/lazyFetchFavourites')
        expect(res).toEqual(null)
      })
    })

    describe('does not exist maxId', () => {
      beforeAll(() => {
        state = () => {
          return {
            favourites: [],
            lazyLoading: false,
            maxId: null
          }
        }
      })
      it('should not be updated', async () => {
        const res = await store.dispatch('TimelineSpace/Contents/Favourites/lazyFetchFavourites')
        expect(res).toEqual(null)
      })
    })

    describe('fetch', () => {
      beforeAll(() => {
        state = () => {
          return {
            favourites: [status1],
            lazyLoading: false,
            maxId: '2'
          }
        }
      })
      it('link is null', async () => {
        mockClient.getFavourites = () => {
          return new Promise<Response<Array<Entity.Status>>>(resolve => {
            const res: Response<Array<Entity.Status>> = {
              data: [status2],
              status: 200,
              statusText: 'OK',
              headers: {
                link: null
              }
            }
            resolve(res)
          })
        }

        await store.dispatch('TimelineSpace/Contents/Favourites/lazyFetchFavourites')
        expect(store.state.TimelineSpace.Contents.Favourites.favourites).toEqual([status1, status2])
        expect(store.state.TimelineSpace.Contents.Favourites.maxId).toEqual(null)
      })

      it('link exists in header', async () => {
        mockClient.getFavourites = () => {
          return new Promise<Response<Array<Entity.Status>>>(resolve => {
            const res: Response<Array<Entity.Status>> = {
              data: [status2],
              status: 200,
              statusText: 'OK',
              headers: {
                link: '<http://localhost?max_id=3>; rel="next"'
              }
            }
            resolve(res)
          })
        }

        await store.dispatch('TimelineSpace/Contents/Favourites/lazyFetchFavourites')
        expect(store.state.TimelineSpace.Contents.Favourites.favourites).toEqual([status1, status2])
        expect(store.state.TimelineSpace.Contents.Favourites.maxId).toEqual('3')
      })
    })
  })
})
