import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, AlertTriangle, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CompanyQuoteRestrictionModal = ({ isOpen, onClose, quoteData = null }) => {
  const navigate = useNavigate();

  const handleCreateUserAccount = () => {
    // Store quote data in localStorage if provided
    if (quoteData) {
      localStorage.setItem('pendingQuote', JSON.stringify(quoteData));
    }
    
    onClose();
    navigate('/user-register', { 
      state: { 
        from: '/user/dashboard',
        message: 'Create your user account to request and track quotes',
        hasPendingQuote: !!quoteData
      }
    });
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                    </div>
                    <Dialog.Title
                      as="h3"
                      className="ml-3 text-lg font-semibold leading-6 text-gray-900"
                    >
                      Account Type Restriction
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="mt-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-800">
                      <strong>Company members cannot request quotes directly.</strong>
                    </p>
                  </div>
                  
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      Your company account is designed for <strong>providing quotes</strong> to users, not requesting them.
                    </p>
                    <p>
                      To request quotes, you need to create a separate <strong>user account</strong> which allows you to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Submit quote requests</li>
                      <li>Track quote responses</li>
                      <li>Communicate with logistics providers</li>
                      <li>Manage your shipping needs</li>
                    </ul>
                    {quoteData && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                        <p className="text-blue-800 text-sm">
                          <strong>Don't worry!</strong> Your quote information will be saved and automatically submitted once you create your user account.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center items-center rounded-md bg-[#bca142] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#B8932E] focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:ring-offset-2 transition-colors"
                    onClick={handleCreateUserAccount}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User Account
                  </button>
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>

                {/* Footer Note */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    You can have both company and user accounts with the same email
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CompanyQuoteRestrictionModal;