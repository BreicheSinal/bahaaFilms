'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import styles from './Contact.module.css';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!accessKey) {
      setSubmitError('Missing Web3Forms access key');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_key: accessKey, ...formData }),
      });

      const responseText = await response.text();
      let result: Record<string, unknown> = {};
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = responseText ? { message: responseText } : {};
      }

      if (!response.ok || result?.success === false) {
        setSubmitError(
          (result as { error?: string; message?: string })?.error ||
            (result as { message?: string })?.message ||
            'Failed to send message'
        );
        return;
      }

      setIsSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
    setSubmitError(null);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  } satisfies Variants;

  const formVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15, delay: 0.15 },
    },
  } satisfies Variants;

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.subtitle}>Contact</div>
          <h2 className={styles.title}>Plan your next visual story.</h2>
          <p className={styles.description}>
            Share your date, location, and the mood you want to capture. I will
            reply with availability, direction, and a clear production plan.
          </p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={formVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <aside className={styles.panel}>
            <p>Available for weddings, portraits, and commercial shoots.</p>
            <p>Based in Lebanon, travel-ready for regional projects.</p>
            <p>Fast turnaround previews and final edits included.</p>
          </aside>

          {isSuccess ? (
            <div className={styles.form}>
              <div className={styles.success}>
                <CheckCircle2 />
                <h3>Message Sent</h3>
                <p>Thanks for reaching out. I will reply soon.</p>
                <button onClick={resetForm} className={`${styles.resetButton} button-glow`}>
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              {submitError && <div className={styles.errorMessage}>{submitError}</div>}
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Name</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={`${styles.input} ${errors.name ? styles.error : ''}`} placeholder="Your name" />
                {errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`${styles.input} ${errors.email ? styles.error : ''}`} placeholder="your.email@example.com" />
                {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.label}>Subject</label>
                <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} className={`${styles.input} ${errors.subject ? styles.error : ''}`} placeholder="What are you planning?" />
                {errors.subject && <div className={styles.errorMessage}>{errors.subject}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.label}>Message</label>
                <textarea id="message" name="message" value={formData.message} onChange={handleChange} className={`${styles.textarea} ${errors.message ? styles.error : ''}`} placeholder="Tell me about your project timeline and style." />
                {errors.message && <div className={styles.errorMessage}>{errors.message}</div>}
              </div>

              <button type="submit" disabled={isSubmitting} className={`${styles.submit} button-glow`}>
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
