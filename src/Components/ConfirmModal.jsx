const ConfirmModal = ({ setConfirmModal, handleSubmit,description="Are you sure? This action cannot be undone!",buttonText="Confirm" }) => {
  return (
    <div className="add-form-holder d-flex justify-content-center align-items-center">
      <div className="myupdatedcard add-admin">
        <div className="card-body">
          <form className="pt-3" onSubmit={handleSubmit}>
            {description}
            <div className="text-end  mt-4 d-flex justify-content-end gap-4">
              <button onClick={() => setConfirmModal(false)} className="btn btn-outline-secondary ">
                Cancel
              </button>
              <button type="submit" className="btn btn-danger">
                {buttonText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
