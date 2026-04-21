import React, { useState, useEffect } from "react";
import {
  AiOutlineSearch,
  AiFillCloseCircle,
  AiOutlineHome,
} from "react-icons/ai";
import { GoLocation } from "react-icons/go";
import { sortby, level, type } from "../../Constants";

const Search = ({ onSearch, filters, setFilters, onClearFilters }) => {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || "");
  const [companyTerm, setCompanyTerm] = useState(filters.companyTerm || "");
  const [locationTerm, setLocationTerm] = useState(filters.locationTerm || "");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({
      searchTerm,
      companyTerm,
      locationTerm,
      sortBy: filters.sortBy,
      type: filters.type,
      level: filters.level,
    });
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setCompanyTerm("");
    setLocationTerm("");
    onClearFilters();
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  useEffect(() => {
    // Trigger search when filters change
    onSearch({
      searchTerm,
      companyTerm,
      locationTerm,
      sortBy: filters.sortBy,
      type: filters.type,
      level: filters.level,
    });
  }, [filters.sortBy, filters.type, filters.level]);

  return (
    <section className="Search">
      <div className="grid gap-9 bg-[#d4d7da] rounded-[10px] p-[1rem] md:p-[3rem] dark:bg-slate-700 ">
        <form onSubmit={handleSearch}>
          <div className="flex flex-wrap w-full justify-between items-center rounded-lg gap-[20px] bg-white p-5 shadow-lg shadow-grey-700 dark:bg-slate-600">
            <div className="flex flex-grow items-center ">
              <AiOutlineSearch className="icon mr-1 dark:invert" />
              <input
                className="bg-transparent w-full text-blue-600 focus:outline-none font-medium dark:text-white"
                placeholder="Search Job..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <AiFillCloseCircle
                  className="text-lg text-[#a5a6a6] hover:text-black hover:dark:invert cursor-pointer"
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
            <div className="flex flex-grow justify-between items-center">
              <AiOutlineHome className="icon mr-1 dark:invert" />
              <input
                className="bg-transparent w-full text-blue-600 focus:outline-none font-medium dark:text-white"
                placeholder="Search Company..."
                type="text"
                value={companyTerm}
                onChange={(e) => setCompanyTerm(e.target.value)}
              />
              {companyTerm && (
                <AiFillCloseCircle
                  className="text-lg text-[#a5a6a6] hover:text-black hover:dark:invert cursor-pointer"
                  onClick={() => setCompanyTerm("")}
                />
              )}
            </div>
            <div className="flex flex-grow justify-between items-center">
              <GoLocation className="icon mr-1 dark:invert" />
              <input
                className="bg-transparent w-full text-blue-600 focus:outline-none font-medium dark:text-white"
                placeholder="Search Location..."
                type="text"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
              />
              {locationTerm && (
                <AiFillCloseCircle
                  className="text-lg text-[#a5a6a6] hover:text-black hover:dark:invert cursor-pointer"
                  onClick={() => setLocationTerm("")}
                />
              )}
            </div>
            <button
              type="submit"
              className="bg-[#2a68ff] flex-grow shrink text-white max-w-full p-3 px-10 rounded-[10px] w-30 hover:bg-blue-500"
            >
              Search
            </button>
          </div>
        </form>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          <div className="flex items-center gap-4">
            <label
              htmlFor="relevance"
              className="font-semibold text-[#6f6f6f] dark:text-white"
            >
              Sort By:
            </label>
            <select
              className="outline-none bg-white rounded-md px-4 py-1 dark:bg-slate-600 dark:text-white"
              id="relevance"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            >
              {sortby.map((options) => (
                <option key={options.id} value={options.value}>
                  {options.value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label
              htmlFor="type"
              className="font-semibold text-[#6f6f6f] dark:text-white"
            >
              Type:
            </label>
            <select
              className="outline-none bg-white rounded-md px-4 py-1 dark:bg-slate-600 dark:text-white"
              id="type"
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
            >
              <option value="">All</option>
              {type.map((typeItem) => (
                <option key={typeItem.id} value={typeItem.value}>
                  {typeItem.value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label
              htmlFor="level"
              className="font-semibold text-[#6f6f6f] dark:text-white"
            >
              Level:
            </label>
            <select
              className="outline-none bg-white rounded-md px-4 py-1 dark:bg-slate-600 dark:text-white"
              id="level"
              value={filters.level}
              onChange={(e) => handleFilterChange("level", e.target.value)}
            >
              <option value="">All</option>
              {level.map((levelItem) => (
                <option key={levelItem.id} value={levelItem.value}>
                  {levelItem.value}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleClearAll}
            className="hover:text-[#2a68ff] text-[#6f6f6f] text-md px-2 py-2 dark:text-white"
          >
            Clear All
          </button>
        </div>
      </div>
    </section>
  );
};

export default Search;