import React from "react";

function RequestItems({ handleChange, index, handleIndividualClose }) {
  return (
    <div className="d-flex  align-items-end ">
      {/* Item Name Input */}
      <div className="flex-grow-1 me-2">
        <label htmlFor="" className="fs-6">
          Name
        </label>
        <input
          onChange={handleChange}
          type="text"
          className="form-control  p-3"
          id={`itemName${index}`}
          name={`itemName${index}`}
          placeholder="Item Name"
          required
        />
      </div>

      {/* Required Quantity Input */}
      <div className="flex-grow-1 me-2">
        <label htmlFor="" className="fs-6">
          Quantity
        </label>

        <input
          onChange={handleChange}
          type="number"
          className="form-control  p-3"
          id={`itemRequired${index}`}
          name={`itemRequired${index}`}
          placeholder="Required Quantity"
          required
        />
      </div>

      {/* Item Price Input */}
      <div className="flex-grow-1 me-2">
        <label htmlFor="" className="fs-6">
          Price
        </label>

        <input
          onChange={handleChange}
          type="text"
          className="form-control  p-3"
          id={`itemPrice${index}`}
          name={`itemPrice${index}`}
          placeholder="Item Price"
          required
        />
      </div>

      {/* Close Icon */}
      <span
        className=" rounded-circle d-flex justify-content-center align-items-center btn btn-danger btn-rounded btn-icon cusing "
        style={{ fontSize: "1.2rem", padding: "8px 12px" }}
        onClick={() => handleIndividualClose(index)}
        title="Remove Item"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
          close
        </span>
      </span>
    </div>
  );
}

export default RequestItems;
