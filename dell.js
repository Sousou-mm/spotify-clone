import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gtlygdciyxdducjarawc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bHlnZGNpeXhkZHVjamFyYXdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzczODA3NiwiZXhwIjoyMDYzMzE0MDc2fQ.59HUbild0_pPisg_QhPXuCuOn5R2lUNhv0K4HYqMDhU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteProduct() {
  const { data, error } = await supabase
    .from('')
    .delete()
    .eq('','')


  if (error) console.error('Ошибка:', error);
  else console.log('Удалено:', data);
}

deleteProduct();