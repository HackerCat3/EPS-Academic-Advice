-- Create storage bucket for teacher attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('teacher-attachments', 'teacher-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for teacher attachments
CREATE POLICY "Teachers can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'teacher-attachments' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can view attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'teacher-attachments' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can delete own attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'teacher-attachments' AND
    owner = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'admin')
    )
  );
