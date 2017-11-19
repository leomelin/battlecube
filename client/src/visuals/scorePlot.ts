import { h } from 'hyperapp';
import { IAppState, IPlayer } from '../initialState';
import { IActions } from '../actions';
import { select, scaleLinear, arc, pie, DefaultArcObject, event } from 'd3';
import '../styles/scorePlot.css';
import { sortByProp } from '../helpers';

const WIDTH = 400;
const HEIGHT = 400;
const RADIUS = Math.min(WIDTH, HEIGHT) / 2 - 5;
const INNER_RADIUS = 0.3 * RADIUS;
const THEME_COLOR = '#55ff55';

const mapPlayerData = (players: IPlayer[]) =>
  players.map((p: IPlayer) => ({
    color: p.color,
    score: +p.score,
    wins: +p.wins,
    label: p.name,
    id: p.name,
    width: 1
  }));

export const createScorePlot = () => {
  const r = scaleLinear()
    .domain([0, 100])
    .range([INNER_RADIUS, RADIUS]);

  const solidArc: any = arc()
    .innerRadius(INNER_RADIUS)
    .outerRadius(
      (d: any) => (RADIUS - INNER_RADIUS) * (d.data.wins / 100) + INNER_RADIUS
    );

  const middleArc: any = arc()
    .innerRadius((d: any) => RADIUS * r(d.data.wins) / RADIUS)
    .outerRadius(RADIUS);

  const coreArc: any = arc()
    .innerRadius(0)
    .outerRadius(INNER_RADIUS);

  const outlineArc: any = arc()
    .innerRadius(INNER_RADIUS)
    .outerRadius(RADIUS);

  const getPies: any = pie()
    .sort(null)
    .value((d: any) => d.width);

  const svg = select('#score-container')
    .append('svg')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .append('g')
    .attr('transform', 'translate(' + WIDTH / 2 + ',' + HEIGHT / 2 + ')');

  const tip = select('body')
    .append('div')
    .attr('class', 'tooltip');

  const onMouseover = ({ data }: any) => {
    tip.style('left', `${event.pageX + 10}px`);
    tip.style('top', `${event.pageY + 25}px`);
    tip.style('display', 'inline-block');
    tip.style('background-color', data.color);
    tip.html(
      `${data.label}<br>wins:&nbsp;${data.wins}<br>score:&nbsp;${data.score.toLocaleString()}`
    );
  };

  return {
    draw: (players: IPlayer[], remainingGames: number) => {
      const data = mapPlayerData(players);
      const pies = getPies(data);
      const games = 100 - remainingGames;

      const sArc = svg.selectAll('.solidArc').data(pies);

      sArc.exit().remove();

      sArc
        .enter()
        .append('path')
        .attr('class', 'solidArc')
        .style('opacity', 0.8)
        .attr('fill', (d: any) => d.data.color)
        .attr('d', solidArc)
        .merge(sArc.attr('d', solidArc))
        .on('mousemove', onMouseover)
        .on('mouseout', () => tip.style('display', 'none'));

      svg
        .selectAll('.outlineArc')
        .data(pies)
        .enter()
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', THEME_COLOR)
        .attr('class', 'outlineArc')
        .attr('d', outlineArc);

      const mArc = svg.selectAll('.middleArc').data(pies);

      mArc.exit().remove();

      mArc
        .enter()
        .append('path')
        .attr('class', 'middleArc')
        .style('opacity', 0.2)
        .attr('fill', ({ data }: any) => data.color)
        .attr('d', middleArc)
        .merge(mArc.attr('d', middleArc))
        .on('mousemove', onMouseover)
        .on('mouseout', () => tip.style('display', 'none'));

      svg
        .selectAll('.core')
        .data(pies)
        .enter()
        .append('path')
        .attr('fill', '#111')
        .attr('d', coreArc);

      svg
        .append('svg:text')
        .attr('class', 'games-played')
        .attr('dy', '.35em')
        .attr('fill', THEME_COLOR)
        .attr('text-anchor', 'middle')
        .text(games);
    }
  };
};

export default (state: IAppState, actions: IActions) =>
  h('div', {
    id: 'score-container',
    oncreate: () => {
      actions.initScorePlot();
    }
  });
