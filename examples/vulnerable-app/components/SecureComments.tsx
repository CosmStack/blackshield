import { SafeHTML } from '@cosmstack/blackshield'
import { useState } from 'react'

interface Comment {
  id: number
  author: string
  content: string
  html: string
}

export function SecureComments() {
  const [comments] = useState<Comment[]>([
    {
      id: 1,
      author: 'Hacker',
      content: 'Check this out!',
      html: '<script>alert("XSS Attack!")</script><p>Malicious content</p>',
    },
    {
      id: 2,
      author: 'User',
      content: 'Normal comment',
      html: '<p>This is a normal comment</p>',
    },
  ])

  return (
    <div>
      <h2>✅ Secure Comments (Using Blackshield)</h2>
      {comments.map((comment) => (
        <div key={comment.id} className="comment">
          <strong>{comment.author}:</strong>
          {/* ✅ SAFE: Using SafeHTML component */}
          <SafeHTML html={comment.html} />
        </div>
      ))}
    </div>
  )
}
