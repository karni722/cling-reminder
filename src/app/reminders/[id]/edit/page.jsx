"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Form, Input, Button, DatePicker, Select, message, Spin, Typography, Card } from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

export default function EditReminderPage() {
  const router = useRouter();
  const params = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminder, setReminder] = useState(null);

  useEffect(() => {
    fetch(`/api/reminders/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        const safeData = {
          title: data.title || "",
          description: data.description || "",
          date: data.date ? dayjs(data.date) : null,
          time: data.time || "",
          device: data.device || "",
          category: data.category || "",
          status: data.status || "upcoming"
        };
        setReminder(safeData);
        form.setFieldsValue(safeData);
        setLoading(false);
      })
      .catch(() => {
        message.error("Cannot load reminder");
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [params.id, form]);

  const handleSave = async (values) => {
    setSaving(true);
    const body = { ...values };
    if (body.date && typeof body.date !== "string") {
      body.date = body.date.format("YYYY-MM-DD");
    }
    fetch(`/api/reminders/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then(() => {
        message.success("Reminder updated!");
        setTimeout(() => router.push("/reminders"), 1000);
      })
      .catch(() => message.error("Failed to save reminder"))
      .finally(() => setSaving(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4" style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #16222a 0%, #3a6073 100%)' }}>
      <Card className="backdrop-blur bg-gray-800/80 border border-gray-700/30 shadow-2xl w-full max-w-xl" bodyStyle={{ background: "transparent", color: "#fff" }}>
        <Title level={2} style={{ color: "#53e3fa", textAlign: "center", marginBottom: 32 }}>Edit Reminder</Title>
        {loading || !reminder ? (
          <div className="flex justify-center items-center" style={{ minHeight: 250 }}><Spin size="large" /></div>
        ) : (
          <Form layout="vertical" form={form} onFinish={handleSave}>
            <Form.Item name="title" label={<span style={{ color: '#fff' }}>Title</span>} rules={[{ required: true, message: 'Title is required' }]}><Input autoFocus /></Form.Item>
            <Form.Item name="description" label={<span style={{ color: '#fff' }}>Description</span>}><TextArea rows={3} /></Form.Item>
            <Form.Item name="date" label={<span style={{ color: '#fff' }}>Date</span>}><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="time" label={<span style={{ color: '#fff' }}>Time</span>}><Input /></Form.Item>
            <Form.Item name="device" label={<span style={{ color: '#fff' }}>Device</span>}><Input /></Form.Item>
            <Form.Item name="category" label={<span style={{ color: '#fff' }}>Category</span>}><Input /></Form.Item>
            <Form.Item name="status" label={<span style={{ color: '#fff' }}>Status</span>}><Select>
              <Option value="upcoming">Upcoming</Option>
              <Option value="completed">Completed</Option>
              <Option value="overdue">Overdue</Option>
            </Select></Form.Item>
            <Form.Item>
              <div className="flex gap-3 mt-6">
                <Button type="primary" htmlType="submit" loading={saving} className="bg-teal-400" style={{ minWidth: 100 }}>Save</Button>
                <Button onClick={() => router.push("/reminders")} className="bg-gray-700 text-white" style={{ minWidth: 100 }}>Cancel</Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}
