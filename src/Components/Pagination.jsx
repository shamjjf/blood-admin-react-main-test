const Pagination = ({ totalPages = 1, currentPage = 1, setCurrentPage }) => {
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbers = 8;

    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
    let endPage = Math.min(totalPages , startPage + maxPageNumbers - 1);

    if (totalPages <= maxPageNumbers) {
      startPage = 1;
      endPage = totalPages;
    } else if (currentPage <= Math.floor(maxPageNumbers / 2)) {
      endPage = maxPageNumbers;
    } else if (currentPage + Math.floor(maxPageNumbers / 2) >= totalPages) {
      startPage = totalPages - maxPageNumbers + 1;
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li
          key={i}
          style={{
            borderTop: "1px solid white",
            borderBottom: "1px solid white",
          }}
          className={`page-item border p-0 m-0 ${currentPage === i ? "active" : ""}`}
        >
          <button className="page-link w-100" onClick={() => handlePageClick(i)}>
            {i}
          </button>
        </li>
      );
    }

    return pageNumbers;
  };

  const handlePreviousClick = () => {
    if (currentPage > 1) {
      handlePageClick(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPage < totalPages) {
      handlePageClick(currentPage + 1);
    }
  };

  return (
    <div className="demo my-auto">
      <nav className="my-auto " aria-label="Page navigation">
        <ul className="pagination my-auto ">
          <li className="page-item p-0 m-0">
            <button
              className="page-link w-100 border"
              aria-label="Previous"
              onClick={handlePreviousClick}
            >
              <span aria-hidden="true">
                <b>«</b>
              </span>
            </button>
          </li>
          {renderPageNumbers()}
          <li className="page-item p-0 m-0 ">
            <button
              className="page-link w-100 border"
              aria-label="Next"
              onClick={handleNextClick}
            >
              <span aria-hidden="true">
                <b>»</b>
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
