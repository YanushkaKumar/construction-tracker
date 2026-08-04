import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Todos (Supabase Test)</h1>
      <ul className="space-y-2">
        {todos && todos.length > 0 ? (
          todos.map((todo: { id: string | number; name: string }) => (
            <li key={todo.id} className="p-3 border rounded-lg shadow-sm">
              {todo.name}
            </li>
          ))
        ) : (
          <li className="text-gray-500 italic">No todos found or table does not exist yet.</li>
        )}
      </ul>
    </div>
  )
}
