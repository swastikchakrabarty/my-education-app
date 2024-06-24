import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'
import { MongoClient } from 'mongodb'
import { verifyPassword } from '../../../utils/auth'

const connectToDatabase = async () => {
  const client = await MongoClient.connect(process.env.MONGODB_URI)
  return client
}

export default NextAuth({
  session: {
    jwt: true,
  },
  providers: [
    Providers.Credentials({
      async authorize(credentials) {
        const client = await connectToDatabase()
        const usersCollection = client.db().collection('users')

        const user = await usersCollection.findOne({ email: credentials.email })
        if (!user) {
          client.close()
          throw new Error('No user found!')
        }

        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) {
          client.close()
          throw new Error('Could not log you in!')
        }

        client.close()
        return { email: user.email }
      },
    }),
  ],
})