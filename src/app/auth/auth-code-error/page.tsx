export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <h1 className="font-serif text-2xl font-bold text-charcoal mb-3">Link expired</h1>
        <p className="text-gray-warm text-sm mb-6">
          That sign-in link is no longer valid — it may have already been used, or it's expired.
          Go back and request a new one.
        </p>
        <a href="/" className="inline-block px-6 py-3 rounded-full bg-orange text-white font-medium text-sm hover:bg-orange-hover transition-colors">
          Back to SpotRise
        </a>
      </div>
    </div>
  );
}