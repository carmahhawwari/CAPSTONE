import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-bg-base px-6 pt-12 pb-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="text-callout text-text-secondary">&larr; back</Link>

        <h1 className="text-regular-semibold text-text-primary mt-6">Privacy Policy</h1>
        <p className="text-subheadline text-text-secondary mt-2">Last updated: April 23, 2026</p>

        <div className="prose text-body text-text-primary mt-8 space-y-5">
          <p>
            Inklings ("we", "us") is a personal messaging app that lets senders text short notes to
            recipients by phone number. This policy explains what information we collect, how we use
            it, and your choices.
          </p>

          <h2 className="text-headline text-text-primary mt-6">Information we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Sender information:</strong> the name you type as a sign-off and the phone
              number you provide for your account.
            </li>
            <li>
              <strong>Recipient information:</strong> the recipient's name and phone number that the
              sender provides.
            </li>
            <li>
              <strong>Message content:</strong> the text, images, and stickers that make up each
              receipt.
            </li>
          </ul>

          <h2 className="text-headline text-text-primary mt-6">How we use information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              To deliver receipts — we send the sender's note as an SMS to the recipient's phone
              using Twilio.
            </li>
            <li>To operate and improve the service.</li>
            <li>To contact you about service issues or changes to this policy.</li>
          </ul>

          <h2 className="text-headline text-text-primary mt-6">What we do not do</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>We do not share, sell, or rent your information to third parties.</li>
            <li>We do not use your information for marketing or advertising purposes.</li>
            <li>We do not use your phone number for anything other than delivering receipts.</li>
          </ul>

          <h2 className="text-headline text-text-primary mt-6">SMS opt-out</h2>
          <p>
            Recipients can reply <strong>STOP</strong> to any Inklings SMS at any time to stop
            receiving further messages. Reply <strong>HELP</strong> for support information.
          </p>

          <h2 className="text-headline text-text-primary mt-6">Third-party services</h2>
          <p>
            We use Twilio to deliver SMS and Supabase to store account and message data. Their use
            of your information is governed by their own privacy policies.
          </p>

          <h2 className="text-headline text-text-primary mt-6">Contact</h2>
          <p>
            Questions about this policy? Email <a className="underline" href="mailto:hello@inklings.app">hello@inklings.app</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
