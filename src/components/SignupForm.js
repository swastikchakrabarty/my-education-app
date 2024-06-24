import { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import styles from './Form.module.css'
import { hashPassword } from '../utils/auth'
import { MongoClient } from 'mongodb'

const SignupForm = () => {
  const [error, setError] = useState(null)

  const initialValues = {
    email: '',
    password: '',
    confirmPassword: '',
  }

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email format').required('Required'),
    password: Yup.string().min(6, 'Password should be minimum 6 characters').required('Required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Required'),
  })

  const onSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true)
    setError(null)
    const { email, password } = values

    const hashedPassword = await hashPassword(password)
    const client = await MongoClient.connect(process.env.MONGODB_URI)
    const db = client.db()
    const existingUser = await db.collection('users').findOne({ email })

    if (existingUser) {
      setError('User already exists!')
      client.close()
      setSubmitting(false)
      return
    }

    await db.collection('users').insertOne({
      email,
      password: hashedPassword,
    })

    client.close()
    setSubmitting(false)
  }

  return (
    <div className={styles.formContainer}>
      <h2>Signup</h2>
      {error && <p className={styles.error}>{error}</p>}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <Field type="email" id="email" name="email" />
              <ErrorMessage name="email" component="div" className={styles.error} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <Field type="password" id="password" name="password" />
              <ErrorMessage name="password" component="div" className={styles.error} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <Field type="password" id="confirmPassword" name="confirmPassword" />
              <ErrorMessage name="confirmPassword" component="div" className={styles.error} />
            </div>
            <button type="submit" disabled={isSubmitting}>
              Signup
            </button>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default SignupForm
