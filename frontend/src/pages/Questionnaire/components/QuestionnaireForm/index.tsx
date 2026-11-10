import { RequestError } from '@/utils/request';
import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useDialog from '../../models/useDialog';

interface Props {
  survey?: API.QuestionnaireSummary;
  loading: boolean;
  onFinish: (values: API.QuestionnaireSetParams) => Promise<void>;
}

export default ({ survey, loading, onFinish }: Props) => {
  const { onClose } = useDialog.getState();
  const [form] = Form.useForm<API.QuestionnaireSetParams>();
  const { t } = useTranslation('questionnaire');

  const onSave = async (values: API.QuestionnaireSetParams) => {
    try {
      await onFinish(values);
    } catch (error) {
      if (!(error instanceof RequestError)) throw error;
      form.setFields([{ name: 'name', errors: [error.message] }]);
    }
  };

  useEffect(() => {
    if (survey) form.setFieldsValue({ name: survey.name, description: survey.description });
    else form.resetFields();
  }, [form, survey]);

  return (
    <Modal
      open
      title={t(survey ? 'editSurvey' : 'create')}
      confirmLoading={loading}
      okText={t(survey ? 'save' : 'submit')}
      onCancel={() => {
        if (!loading) onClose();
      }}
      onOk={() => form.submit()}
    >
      <Form layout="vertical" form={form} disabled={loading} onFinish={onSave}>
        <Form.Item
          name="name"
          label={t('name')}
          rules={[{ required: true, whitespace: true, message: t('nameRequired') }]}
        >
          <Input autoFocus />
        </Form.Item>
        <Form.Item name="description" label={t('description')}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
