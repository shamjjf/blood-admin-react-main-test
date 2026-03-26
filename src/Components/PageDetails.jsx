const PageDetails = ({ totalCount = 80, totalPages = 8, limit = 10, handelLimit }) => {
  return (
    <div className="page-detail-holder mt-0">
      <div className="limit-holder ">
        <label style={{ fontSize: "1rem", fontWeight: "bold" }} className="text-white mt-2">
          Item Per Page:{" "}
        </label>
        <select
          name="limit"
          value={limit}
          style={{
            borderRadius: 5,
          }}
          className="block w-32 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          onChange={(e) => handelLimit(e.target.value)}
        >
          <option value="1">1</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="20">20</option>
          <option value="25">25</option>
        </select>
      </div>
    </div>
  );
};

export default PageDetails;
