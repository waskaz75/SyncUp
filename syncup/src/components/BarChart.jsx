function BarChart({
  title,
  days,
  maxValue,
  formatAxis,
  unitLabel,
  labelEvery = 1,
}) {
  return (
    <figure className="me-chart">
      <figcaption className="me-chart-title">{title}</figcaption>

      <div className="me-chart-body">
        <div className="me-chart-axis" aria-hidden="true">
          <span>{formatAxis(maxValue)}</span>
          <span>{formatAxis(0)}</span>
        </div>

        <div
          className="me-chart-plot"
          style={{ "--bar-count": days.length }}
          aria-hidden="true"
        >
          {days.map((day, index) => {
            const height = day.value
              ? Math.min(100, (day.value / maxValue) * 100)
              : 0;

            const classes = [
              "me-chart-col",
              day.isToday && "today",
              day.isFuture && "future",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={day.key}
                className={classes}
                title={`${day.fullLabel}: ${day.valueText}`}
              >
                <div className="me-chart-bar-area">
                  {height > 0 && (
                    <div
                      className="me-chart-bar"
                      style={{ height: `${height}%`, background: day.color }}
                    />
                  )}
                </div>

                <span className="me-chart-label">
                  {index % labelEvery === 0 ? day.label : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>{unitLabel}</th>
          </tr>
        </thead>
        <tbody>
          {days
            .filter((day) => !day.isFuture)
            .map((day) => (
              <tr key={day.key}>
                <td>{day.fullLabel}</td>
                <td>{day.valueText}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
}

export default BarChart;