import { createContext } from 'react'

const UserContext = createContext({
  currentUser: null,
  setCurrentUser: () => {},
  refreshCurrentUser: async () => {},
  isUserLoading: true,
})

export default UserContext
