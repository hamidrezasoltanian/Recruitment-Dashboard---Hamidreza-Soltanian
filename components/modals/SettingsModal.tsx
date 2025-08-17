import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { CompanyProfile, JobPosition, KanbanStage, Template, TestLibraryItem, UserWithPassword } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import { useTemplates } from '../../contexts/TemplateContext';
import { aiService } from '../../services/aiService';
import { useCandidates } from '../../contexts/CandidatesContext';

const UserManagementPanel: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, changePassword, currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState<UserWithPassword | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { addToast } = useToast();

  React.useEffect(() => {
    if (editingUser) {
        setUsername(editingUser.username);
        setName(editingUser.name);
        setIsAdmin(editingUser.isAdmin);
        setPassword('');
    } else {
        setUsername('');
        setName('');
        setPassword('');
        setIsAdmin(false);
    }
  }, [editingUser]);

  const handleSelectUserForEdit = (user: UserWithPassword) => {
    setIsAdding(false);
    setEditingUser(user);
  };
  
  const handleAddNew = () => {
    setIsAdding(true);
    setEditingUser(null);
    setUsername('');
    setName('');
    setPassword('');
    setIsAdmin(false);
  }

  const handleSave = () => {
    if (!username || !name) {
        addToast('نام کاربری و نام کامل الزامی است.', 'error');
        return;
    }
    const userData = { username: username.toLowerCase(), name, password, isAdmin };

    if (isAdding) {
        if (!password) {
            addToast('رمز عبور برای کاربر جدید الزامی است.', 'error');
            return;
        }
        addUser(userData);
    } else if (editingUser) {
        updateUser(editingUser.username, { name, isAdmin });
        if(password) {
            changePassword(editingUser.username, password, password, true);
        }
    }
    setEditingUser(null);
    setIsAdding(false);
  };

  const handleDelete = (usernameToDelete: string) => {
    if (usernameToDelete === currentUser?.username) {
        addToast('شما نمی‌توانید حساب کاربری خود را حذف کنید.', 'error');
        return;
    }
    if (window.confirm(`آیا از حذف کاربر ${usernameToDelete} مطمئن هستید؟`)) {
        deleteUser(usernameToDelete);
        if (editingUser?.username === usernameToDelete) {
          setEditingUser(null);
        }
    }
  };
  
  const activeUsers = Object.values(users);

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="font-bold mb-2">لیست کاربران</h3>
          <div className="space-y-2">
            {activeUsers.map(u => (
              <div key={u.username} className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${editingUser?.username === u.username || (isAdding && !editingUser) ? 'bg-indigo-100' : 'hover:bg-gray-100'}`} onClick={() => handleSelectUserForEdit(u)}>
                <span>{u.name} ({u.isAdmin ? 'ادمین' : 'کارشناس'})</span>
                { u.username !== currentUser?.username &&
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(u.username); }} className="text-red-500 hover:text-red-700 text-xs px-1">حذف</button>
                }
              </div>
            ))}
          </div>
           <button onClick={handleAddNew} className={`mt-4 w-full font-bold py-2 px-4 rounded-lg transition-colors ${isAdding ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>+ افزودن کاربر جدید</button>
        </div>

        <div className="md:col-span-2">
            {(editingUser || isAdding) && (
            <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-4">{isAdding ? 'افزودن کاربر جدید' : `ویرایش کاربر: ${editingUser?.name}`}</h3>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نام کاربری</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} disabled={!isAdding} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 disabled:bg-gray-200"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">نام کامل</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">رمز عبور</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isAdding ? 'ضروری' : 'برای عدم تغییر، خالی بگذارید'} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                    </div>
                     <div className="flex items-center">
                        <input id="isAdmin" type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} disabled={currentUser?.username === username} className="h-4 w-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50"/>
                        <label htmlFor="isAdmin" className="mr-2 block text-sm text-gray-900">دسترسی ادمین</label>
                    </div>
                    <div className="flex justify-end gap-2">
                         <button onClick={() => { setEditingUser(null); setIsAdding(false); }} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg">انصراف</button>
                         <button onClick={handleSave} className="bg-indigo-600 text-white py-2 px-4 rounded-lg">ذخیره</button>
                    </div>
                 </div>
            </div>
            )}
        </div>
      </div>
  );
};

const SourceManagementPanel: React.FC = () => {
    const { sources, addSource, deleteSource } = useSettings();
    const [newSource, setNewSource] = useState('');

    const handleAddSource = () => {
        addSource(newSource);
        setNewSource('');
    };

    return (
        <div className="max-w-md mx-auto">
            <h3 className="font-bold mb-4">لیست منابع</h3>
            <div className="space-y-2 mb-4">
                {sources.map(s => (
                    <div key={s} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                        <span>{s}</span>
                        <button onClick={() => deleteSource(s)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>
                    </div>
                ))}
            </div>
             <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newSource} 
                    onChange={e => setNewSource(e.target.value)} 
                    placeholder="افزودن منبع جدید..." 
                    className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button onClick={handleAddSource} className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">افزودن</button>
             </div>
        </div>
    );
};

const StageManagementPanel: React.FC = () => {
    const { stages, addStage, updateStage, deleteStage } = useSettings();
    const { candidates } = useCandidates();
    const { addToast } = useToast();
    const [newStageTitle, setNewStageTitle] = useState('');
    const [editingStage, setEditingStage] = useState<KanbanStage | null>(null);

    const handleAddStage = () => {
        addStage(newStageTitle);
        setNewStageTitle('');
    };

    const handleSaveEdit = () => {
        if (editingStage) {
            updateStage(editingStage.id, editingStage.title);
            setEditingStage(null);
        }
    };

    const handleDelete = (id: string) => {
        if (candidates.some(c => c.stage === id)) {
            addToast('نمی‌توان مرحله‌ای که دارای متقاضی است را حذف کرد.', 'error');
            return;
        }
        deleteStage(id);
    };

    return (
      <div className="max-w-md mx-auto">
        <h3 className="font-bold mb-4">لیست مراحل کانبان</h3>
        <div className="space-y-2 mb-4">
          {stages.filter(s => s.id !== 'archived').map(stage => (
            <div key={stage.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
              {editingStage?.id === stage.id ? (
                <input
                  type="text"
                  value={editingStage.title}
                  onChange={e => setEditingStage({ ...editingStage, title: e.target.value })}
                  className="flex-grow border-gray-300 rounded-md py-1 px-2 text-sm"
                />
              ) : (
                <span>{stage.title}</span>
              )}
              <div className="flex gap-3">
                {editingStage?.id === stage.id ? (
                  <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 text-xs">ذخیره</button>
                ) : (
                  <button onClick={() => setEditingStage(stage)} className="text-blue-600 hover:text-blue-800 text-xs">ویرایش</button>
                )}
                {!stage.isCore && (
                  <button onClick={() => handleDelete(stage.id)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newStageTitle}
            onChange={e => setNewStageTitle(e.target.value)}
            placeholder="افزودن مرحله جدید..."
            className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
          />
          <button onClick={handleAddStage} className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">افزودن</button>
        </div>
      </div>
    );
};

const TemplateManagementPanel: React.FC = () => {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const { stages } = useSettings();
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'email' | 'whatsapp'>('email');
  const [stageId, setStageId] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { addToast } = useToast();

  React.useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setContent(editingTemplate.content);
      setType(editingTemplate.type);
      setStageId(editingTemplate.stageId || '');
    } else {
      setName('');
      setContent('');
      setType('email');
      setStageId('');
    }
  }, [editingTemplate]);

  const handleSelectTemplate = (template: Template) => {
    setIsAdding(false);
    setEditingTemplate(template);
  };
  
  const handleAddNew = () => {
    setIsAdding(true);
    setEditingTemplate(null);
  };
  
  const handleCancel = () => {
      setIsAdding(false);
      setEditingTemplate(null);
  }

  const handleSave = () => {
    const templateData = { name, content, type, stageId: stageId || undefined };
    if (isAdding) {
      addTemplate(templateData);
    } else if (editingTemplate) {
      updateTemplate({ ...editingTemplate, ...templateData });
    }
    handleCancel();
  };
  
  const handleDelete = (id: string) => {
      if(window.confirm('آیا از حذف این قالب مطمئن هستید؟')) {
          deleteTemplate(id);
          if (editingTemplate?.id === id) {
              handleCancel();
          }
      }
  };
  
  const handleGenerateWithAI = async () => {
      if (!name) {
          addToast("لطفا ابتدا یک نام یا هدف برای قالب مشخص کنید.", 'error');
          return;
      }
      setIsAiLoading(true);
      try {
          const generatedContent = await aiService.generateTemplateContent(`ایجاد یک قالب ${type === 'email' ? 'ایمیل' : 'واتسپ'} برای: ${name}`);
          setContent(generatedContent);
      } catch (e: any) {
          addToast(e.message, 'error');
      } finally {
          setIsAiLoading(false);
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <h3 className="font-bold mb-2">لیست قالب‌ها</h3>
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${editingTemplate?.id === t.id ? 'bg-indigo-100' : 'hover:bg-gray-100'}`} onClick={() => handleSelectTemplate(t)}>
              <span className="truncate">{t.name}</span>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-red-500 hover:text-red-700 text-xs px-1 flex-shrink-0">حذف</button>
            </div>
          ))}
        </div>
        <button onClick={handleAddNew} className={`mt-4 w-full font-bold py-2 px-4 rounded-lg transition-colors ${isAdding ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>+ افزودن قالب جدید</button>
      </div>

      <div className="md:col-span-2">
        {(editingTemplate || isAdding) && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold mb-4">{isAdding ? 'افزودن قالب جدید' : `ویرایش قالب: ${editingTemplate?.name}`}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">نام قالب (مثلا: ایمیل پیشنهاد شغلی)</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">نوع</label>
                    <select value={type} onChange={e => setType(e.target.value as 'email' | 'whatsapp')} className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3">
                      <option value="email">ایمیل</option>
                      <option value="whatsapp">واتسپ</option>
                    </select>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700">مربوط به مرحله (اختیاری)</label>
                    <select value={stageId} onChange={e => setStageId(e.target.value)} className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3">
                      <option value="">عمومی</option>
                      {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
              </div>
              <div>
                 <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">محتوای قالب</label>
                    <button onClick={handleGenerateWithAI} disabled={isAiLoading} className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                        {isAiLoading ? 'در حال پردازش...' : 'تولید با AI ✨'}
                    </button>
                 </div>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="محتوای خود را وارد کنید یا با AI تولید کنید. از متغیرها استفاده کنید."></textarea>
                 <p className="text-xs text-gray-500 mt-1">{'متغیرهای مجاز: `{{candidateName}}`, `{{position}}`, `{{interviewDate}}`, `{{companyName}}`, `{{companyAddress}}`, `{{stageName}}`'}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={handleCancel} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg">انصراف</button>
                <button onClick={handleSave} className="bg-indigo-600 text-white py-2 px-4 rounded-lg">ذخیره</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CompanyProfilePanel: React.FC = () => {
    const { companyProfile, updateCompanyDetails, addJobPosition, updateJobPosition, deleteJobPosition } = useSettings();
    const [details, setDetails] = useState(companyProfile);
    const [newJobTitle, setNewJobTitle] = useState('');
    const [editingJob, setEditingJob] = useState<JobPosition | null>(null);

    useEffect(() => {
        setDetails(companyProfile);
    }, [companyProfile]);

    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDetails(prev => ({...prev, [e.target.name]: e.target.value}));
    }
    
    const handleSaveDetails = () => {
        const {name, website, address} = details;
        updateCompanyDetails({name, website, address});
    }

    const handleAddJob = () => {
        addJobPosition(newJobTitle);
        setNewJobTitle('');
    }

    const handleSaveJobEdit = () => {
        if(editingJob) {
            updateJobPosition(editingJob.id, editingJob.title);
            setEditingJob(null);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">اطلاعات شرکت</h3>
                <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">نام شرکت</label>
                    <input type="text" name="name" id="companyName" value={details.name} onChange={handleDetailChange} onBlur={handleSaveDetails} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">وب‌سایت</label>
                    <input type="text" name="website" id="website" value={details.website} onChange={handleDetailChange} onBlur={handleSaveDetails} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">آدرس</label>
                    <textarea name="address" id="address" value={details.address} onChange={handleDetailChange} onBlur={handleSaveDetails} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                </div>
            </div>

            {/* Job Positions */}
            <div>
                 <h3 className="text-lg font-bold text-gray-800 mb-4">موقعیت‌های شغلی</h3>
                 <div className="space-y-2 mb-4">
                    {companyProfile.jobPositions.map(job => (
                        <div key={job.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                           {editingJob?.id === job.id ? (
                               <input type="text" value={editingJob.title} onChange={e => setEditingJob({...editingJob, title: e.target.value})} className="flex-grow border-gray-300 rounded-md py-1 px-2 text-sm"/>
                           ) : (
                               <span>{job.title}</span>
                           )}
                            <div className="flex gap-2">
                               {editingJob?.id === job.id ? (
                                  <button onClick={handleSaveJobEdit} className="text-green-600 hover:text-green-800">ذخیره</button>
                               ) : (
                                  <button onClick={() => setEditingJob(job)} className="text-blue-600 hover:text-blue-800">ویرایش</button>
                               )}
                                <button onClick={() => deleteJobPosition(job.id)} className="text-red-500 hover:text-red-700">حذف</button>
                            </div>
                        </div>
                    ))}
                 </div>
                 <div className="flex gap-2">
                     <input type="text" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} placeholder="افزودن موقعیت جدید..." className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                     <button onClick={handleAddJob} className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">افزودن</button>
                 </div>
            </div>
        </div>
    )
}

const ApiKeyPanel: React.FC = () => {
    const [isKeySet, setIsKeySet] = useState(false);

    useEffect(() => {
        // Safely check for API key to prevent crash when not using the build process.
        let keyAvailable = false;
        try {
            // The build process replaces process.env.API_KEY with the actual value.
            // If it's a non-empty string, the key is set.
            if (process.env.API_KEY) {
                keyAvailable = true;
            }
        } catch (e) {
            // process is not defined, so the key is not available.
            keyAvailable = false;
        }
        setIsKeySet(keyAvailable);
    }, []);

    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-2">پیکربندی کلید API (Gemini)</h3>
            <div className="flex items-center gap-2 mb-4">
                <p className="font-medium">وضعیت کلید:</p>
                {isKeySet ? (
                    <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-200 rounded-full">فعال و پیکربندی شده</span>
                ) : (
                    <span className="px-3 py-1 text-sm font-semibold text-red-800 bg-red-200 rounded-full">پیکربندی نشده</span>
                )}
            </div>
            <div className="space-y-2 text-sm text-gray-700">
                <p><strong className="font-bold text-red-600">نکته امنیتی مهم:</strong> برای حفظ امنیت، کلید API هرگز نباید مستقیماً در رابط کاربری برنامه وارد شود.</p>
                <p>روش صحیح و امن، تنظیم کلید به عنوان یک متغیر محیطی (Environment Variable) در محیطی است که برنامه در آن اجرا می‌شود.</p>
                <p>لطفا از مدیر سیستم بخواهید متغیر محیطی با نام <code className="bg-gray-200 text-red-700 p-1 rounded font-mono">API_KEY</code> را با مقدار کلید Gemini شما تنظیم کند.</p>
                 {!isKeySet && <p className="font-bold mt-2">تا زمانی که کلید پیکربندی نشود، قابلیت‌های هوش مصنوعی کار نخواهند کرد.</p>}
            </div>
        </div>
    )
}

const TestLibraryPanel: React.FC = () => {
    const { testLibrary, addTest, updateTest, deleteTest } = useSettings();
    const [editingTest, setEditingTest] = useState<TestLibraryItem | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        if(editingTest) {
            setName(editingTest.name);
            setUrl(editingTest.url);
            setIsAdding(false);
        } else {
            setName('');
            setUrl('');
        }
    }, [editingTest]);

    const handleSelectTest = (test: TestLibraryItem) => {
        setEditingTest(test);
        setIsAdding(false);
    }
    
    const handleAddNew = () => {
        setEditingTest(null);
        setIsAdding(true);
    }

    const handleCancel = () => {
        setEditingTest(null);
        setIsAdding(false);
    }

    const handleSave = () => {
        if(isAdding) {
            addTest({ name, url });
        } else if (editingTest) {
            updateTest({ ...editingTest, name, url });
        }
        handleCancel();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("آیا از حذف این آزمون از کتابخانه مطمئن هستید؟")) {
            deleteTest(id);
            if(editingTest?.id === id) {
                handleCancel();
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <h3 className="font-bold mb-2">لیست آزمون‌ها</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {testLibrary.map(t => (
                        <div key={t.id} className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${editingTest?.id === t.id ? 'bg-indigo-100' : 'hover:bg-gray-100'}`} onClick={() => handleSelectTest(t)}>
                           <span className="truncate">{t.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-red-500 hover:text-red-700 text-xs px-1 flex-shrink-0">حذف</button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddNew} className={`mt-4 w-full font-bold py-2 px-4 rounded-lg transition-colors ${isAdding ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>+ افزودن آزمون جدید</button>
            </div>
            <div className="md:col-span-2">
                {(editingTest || isAdding) && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold mb-4">{isAdding ? 'افزودن آزمون جدید' : `ویرایش آزمون: ${editingTest?.name}`}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">نام آزمون</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">لینک (URL)</label>
                                <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={handleCancel} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg">انصراف</button>
                                <button onClick={handleSave} className="bg-indigo-600 text-white py-2 px-4 rounded-lg">ذخیره</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    type Tab = 'profile' | 'stages' | 'users' | 'sources' | 'templates' | 'apiKey' | 'tests';
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    const tabClasses = (tabName: Tab) => 
        `whitespace-nowrap py-2 px-4 font-medium text-sm rounded-t-lg transition-colors cursor-pointer ${
            activeTab === tabName 
            ? 'bg-white border-gray-200 border-l border-t border-r -mb-px text-indigo-600' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تنظیمات">
            <div className="w-full">
                <div className="border-b border-gray-200">
                    <nav className="flex flex-wrap space-x-2 space-x-reverse">
                        <button onClick={() => setActiveTab('profile')} className={tabClasses('profile')}>پروفایل شرکت</button>
                        <button onClick={() => setActiveTab('stages')} className={tabClasses('stages')}>مراحل کانبان</button>
                        <button onClick={() => setActiveTab('tests')} className={tabClasses('tests')}>کتابخانه آزمون</button>
                        <button onClick={() => setActiveTab('templates')} className={tabClasses('templates')}>مدیریت قالب‌ها</button>
                        <button onClick={() => setActiveTab('users')} className={tabClasses('users')}>مدیریت کاربران</button>
                        <button onClick={() => setActiveTab('sources')} className={tabClasses('sources')}>مدیریت منابع</button>
                        <button onClick={() => setActiveTab('apiKey')} className={tabClasses('apiKey')}>کلید API</button>
                    </nav>
                </div>
                <div className="pt-6 bg-white p-6 rounded-b-lg">
                    {activeTab === 'profile' && <CompanyProfilePanel />}
                    {activeTab === 'stages' && <StageManagementPanel />}
                    {activeTab === 'users' && <UserManagementPanel />}
                    {activeTab === 'sources' && <SourceManagementPanel />}
                    {activeTab === 'templates' && <TemplateManagementPanel />}
                    {activeTab === 'apiKey' && <ApiKeyPanel />}
                    {activeTab === 'tests' && <TestLibraryPanel />}
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal;