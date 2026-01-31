import InlineLoader from './InlineLoader';

const PageLoader = ({ loading, error, children, loadingMessage = "Loading..." }) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <InlineLoader size="large" message={loadingMessage} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4 max-w-md">
            <h3 className="font-semibold mb-2">Error</h3>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#bca142] text-white px-6 py-2 rounded hover:bg-yellow-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default PageLoader;