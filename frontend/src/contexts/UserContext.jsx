import { createContext } from 'react'

const UserContext = createContext({
  currentUser: null,
  setCurrentUser: () => {},
  isUserLoading: true,
})

export default UserContext
